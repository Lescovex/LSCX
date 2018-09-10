import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

@Injectable()
export class MarketService {
	config: any;
	token: any;
	contractEtherDelta: any = {};
	contractToken: any = {};
	contractReserveToken: any = {};
	etherdeltaBalances: any = {token:null, eth:null};
	socket;
	state: any = {
		orders: undefined,
		trades: undefined,
		myOrders: undefined,
		myTrades: undefined
	};

	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService) {
		this.setCongif();	
		this.setContracts();
		this.setToken();
		this.setTokencontract();
	}
	

	setCongif() {
		let file = (this._web3.network == 1)? 'main': 'testnet';
		this.config= require('../../etherdelta/config/'+file+'.json');
	}

	getAbi(file) {
		return require('../../etherdelta/smart_contract/'+file+'.sol.json');
	}

	setToken(token?) {
		if(typeof(token)=="undefined"){
			this.token = this.config.tokens[1]; 
		}else{
			this.token = token;
		}
		this.resetTokenBalances();
		this.setTokencontract();
	}


	setContracts() {	
		this.contractEtherDelta = this._contract.contractInstance(this.getAbi('etherdelta'),this.config.contractEtherDeltaAddrs[0].addr);
		this.contractToken = this._web3.web3.eth.contract(this.getAbi('token'));
		this.contractReserveToken = this._web3.web3.eth.contract(this.getAbi('reservetoken'));
	}

	setTokencontract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}
	
	getFunctionData(contract, functionName:string, params?) {
		if(typeof(params)== 'undefined'){
			params= []
		}
		return this._contract.getFunctionData(contract,functionName, params)
	}

	async getBalance() {
		let balance:number = 0;
		if(this.token.name =="ETH"){
			balance = this._account.account.balance
		}else{
			let value = await this._contract.callFunction(this.token.contract, 'balanceOf', [this._account.account.address]);
			balance = parseInt(value.toString())/Math.pow(10,this.token.decimals)
		}
		
		return balance;
	}

	async getEtherdeltaBalance() {
		let balance = await this._contract.callFunction(this.contractEtherDelta, 'balanceOf', [this.token.addr, this._account.account.address]);
		let value : number = parseInt(balance.toString())/Math.pow(10,this.token.decimals);
		return balance;
	}

	async getEtherdeltaEther() {
		let balance = await this._contract.callFunction(this.contractEtherDelta, 'balanceOf', [this.config.tokens[0].addr, this._account.account.address]);
		let value:number = parseInt(balance.toString())/Math.pow(10,18);
		return value
	}
	resetTokenBalances() {
		this.token.balance = null;
		this.etherdeltaBalances.token = null;
	}
	async setBalances() {
		this.token.balance = await this.getBalance();
		if(this.token.name =="ETH"){
			this.etherdeltaBalances.token = await this.getEtherdeltaEther();
		}else{
			this.etherdeltaBalances.token = await this.getEtherdeltaBalance();
		}		
		this.etherdeltaBalances.eth = await this.getEtherdeltaEther();
	}

	async balancesInterval() {
		return setInterval(async ()=>{
			this.setBalances();
		},2000)
	}

}