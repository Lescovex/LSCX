import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

import { Order } from '../models/order';

const io = require('socket.io-client');

import * as EthUtil from 'ethereumjs-util';


@Injectable()
export class MarketService {
	config: any;
	token: any;
	eth: any;
	contractEtherDelta: any = {};
	contractToken: any = {};
	contractReserveToken: any = {};
	etherdeltaBalances: any = {token:null, eth:null};
	socket;
	state: any = {
		orders: undefined,
		myOrders: undefined,
	};
	sha256;

	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService) {
		this.setMarket();
		
	}

	setCongif() {
		let file = (this._web3.network == 1)? 'main': 'testnet';
		this.config= require('../../libs/market-lib/config/'+file+'.json');
	}

	getAbi(file) {
		return require('../../libs/market-lib/smart_contract/'+file+'.sol.json');
	}

	setToken(token?) {
		console.log(token)
		if(typeof(token)=="undefined"){
			this.token = this.config.tokens[1]; 
		}else{
			this.token = token;
		}
		this.setTokenContract();
		this.resetTokenBalances();
	}


	setContracts() {	
		this.contractEtherDelta = this._contract.contractInstance(this.getAbi('etherdelta'),this.config.contractEtherDeltaAddrs[0].addr);
		this.contractToken = this._web3.web3.eth.contract(this.getAbi('token'));
		this.contractReserveToken = this._web3.web3.eth.contract(this.getAbi('reservetoken'));
	}

	setTokenContract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}

	setMarket(){
		this.setCongif();	
		this.setContracts();
		this.eth = this.config.tokens[0];
		this.setToken();
		this.setSocket();
		this.setSha256();
	}

	setSha256(){
		let abi = [{"constant": true, "inputs": [{"name": "contrato","type": "address"},{"name": "tokenGet","type": "address"},{"name": "amountGet","type": "uint256"},{"name": "tokenGive","type": "address"},
				{"name": "amountGive","type": "uint256"},{"name": "expires","type": "uint256"},{"name": "nonce","type": "uint256"}],
				"name": "gethash", 	"outputs": [{"name": "","type": "bytes32"}],"payable": false,"stateMutability": "pure","type": "function"}]
		let address = '';
		if(this._web3.network==1){
			address = '0x7b74ad8391111b3d71d95fef3b32b333f1f5d6c0';
		}else{
			address = '0x338692dfa7a3c6455b25daa831229a949f320844';
		}
		this.sha256 = this._contract.contractInstance(abi, address);
	}

	setSocket(){
		this.socket = io.connect(this.config.socketServer[0], { transports: ['websocket'] });
		this.socket.on('connect', () => {
			console.log('socket connected', this.socket);
		  });
		  this.waitForMarket();
	}

	resetSocket(token?) {
		console.log("before", this.state)
		this.socket.close();
		this.state = {

			orders : undefined,
			myOrders: undefined,
		};
		if(typeof(token)== 'undefined'){
			this.setToken();
		}else{
			this.setToken(token)
		}
		this.setSocket();
		console.log("after", this.state)
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

	async orderHash(params) {
		let msgIn = await this._contract.callFunction(this.sha256, 'gethash',params);
		console.log(await msgIn);
		let msgStr = msgIn.toString();
		let msg = new Buffer(msgStr.slice(2), 'hex');
		msg = Buffer.concat([
			new Buffer(`\x19Ethereum Signed Message:\n${msg.length.toString()}`),
			msg]);
		msgStr = this._web3.web3.sha3(`0x${msg.toString('hex')}`, { encoding: 'hex' });
		msg = new Buffer(msgStr.slice(2), 'hex');
		return `0x${msg.toString('hex')}`;
	}

	signOrder(msgToSign, privateKeyIn){
		console.log(msgToSign, privateKeyIn)
		const privateKey = (privateKeyIn.toString('hex')).substring(0, 2) === '0x' ? privateKeyIn.substring(2) : privateKeyIn;
		const sig = EthUtil.ecsign(	new Buffer(msgToSign.slice(2), 'hex'), new Buffer(privateKey, 'hex'));
		const r = `0x${sig.r.toString('hex')}`;
		const s = `0x${sig.s.toString('hex')}`;
		const v = sig.v;
		const result = { r, s, v, msg: msgToSign };
		return result;
	}

	placeOrder(params, sig){
		let order = {
			amountGive: params[4],
			tokenGive: params[3],
			amountGet: params[2],
			tokenGet: params[1],
			contractAddr: params[0],
			expires: params[5],
			nonce: params[6],
			user: this._account.account.address,
			v: sig.v,
			r: sig.r,
			s: sig.s
		}
		
		let self = this;
		return new Promise((resolve, reject) => {
			self.socket.emit('message', order);
			self.socket.once('messageResult', (messageResult) => {
			  if (!messageResult) reject();
			  resolve(messageResult);
			});
		  });
	}
	

	async getEtherdeltaBalance() {
		let balance = await this._contract.callFunction(this.contractEtherDelta, 'balanceOf', [this.token.addr, this._account.account.address]);
		let value : number = parseInt(balance.toString())/Math.pow(10,this.token.decimals);
		return value;
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
		console.log("token balance",this.etherdeltaBalances.token)
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

	waitForMarket(){
		let self = this;
		new Promise((resolve, reject) => {
			setTimeout(() => {
			  reject('Could not get market');
			}, 20000);
			self.socket.off('orders');
			self.socket.off('trades');
			self.getMarketAndWait();
		});
	}
	
	getMarket(){
		
		if (!this.token.addr) throw new Error('Please enter a valid token');
		if (!this._account.account.address) throw new Error('Please enter a valid address');
		this.socket.emit('getMarket', { token: this.token.addr , user: this._account.account.address });
	}

	getMarketAndWait(){
		let interval;
		this.getMarket();
		this.socket.once('market', (market) => {
			console.log("market", market)
			if('orders' in market){
				this.updateOrders(market.orders, this.token, this._account.account.address);
				this.socket.on('orders', (orders) => {
				  	this.updateOrders(orders, this.token, this._account.account.address);
				});
				  clearInterval(interval);
			}else{
				interval = setTimeout(() => {
					this.getMarketAndWait();
				}, 2000);
			}		
		});
	}
	
	updateOrders = (newOrders, token, user) => {
		const newOrdersTransformed = {
		  buys: newOrders.buys
			.map(x => x = new Order(x, 'buy', token)
			),
		  sells: newOrders.sells
		  .map(x => x = new Order(x, 'sell', token)
		  ),
		};
		console.log("new",newOrdersTransformed)
		if (!this.state.orders) this.state.orders = { buys: [], sells: [] };
		if (!this.state.myOrders) this.state.myOrders = { buys: [], sells: [] };
		this.compareOrders(newOrdersTransformed, 'buys');
		this.compareOrders(newOrdersTransformed, 'sells');
		this.state.orders = {
		  sells: this.state.orders.sells.sort((a, b) =>
			a.price - b.price || a.amountGet - b.amountGet),
		  buys: this.state.orders.buys.sort((a, b) =>
			b.price - a.price || b.amountGet - a.amountGet),
		};
		this.state.myOrders = {
		  sells: this.state.myOrders.sells.sort((a, b) =>
			a.price - b.price || a.amountGet - b.amountGet),
		  buys: this.state.myOrders.buys.sort((a, b) =>
			b.price - a.price || b.amountGet - a.amountGet),
		};
		console.log(this.state)
	};

	compareOrders(newOrdersTransformed, type){
		newOrdersTransformed[type].forEach((x) => {
			if (x.deleted == true || x.ethAvailableVolumeBase <= this.config.minOrderSize) {
				console.log('deleted')
				this.state.orders[type] = this.state.orders[type].filter(y => y.id !== x.id);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type] = this.state.myOrders[type].filter(y => y.id !== x.id);
				}
			} else if (this.state.orders[type].find(y => y.id === x.id)) {
				console.log('ya está')
				this.state.orders[type] = this.state.orders[type].map(y => (y.id === x.id ? x : y));
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type] = this.state.myOrders[type].map(y => (y.id === x.id ? x : y));
				}
			} else {
				console.log('nuevo')
				this.state.orders[type].push(x);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type].push(x);
				}
			}
		});
	}

	toWei(eth, decimals){
		return new BigNumber(String(eth))
		.times(new BigNumber(10 ** decimals));
	}
}