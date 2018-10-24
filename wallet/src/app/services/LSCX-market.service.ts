import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

import { Order } from '../models/order';
import { Trade } from '../models/trade';

declare var require: any;

const fs = require('fs');
const homedir = require('os').homedir();
const lescovexPath = homedir+"/.lescovex";
import * as EthUtil from 'ethereumjs-util';
import { LSCXMarketStorageService } from './LSCX-marketStorage.service';


@Injectable()
export class LSCXMarketService {
	FILESNAMES = {1:"main", 3:"ropsten", 42:"kovan"};
	fileName:string;
	config: any;
	token: any;
	eth: any;
	contractMarket: any = {};
	contractToken: any = {};
	contractReserveToken: any = {};
	marketBalances: any = {token:null, eth:null};
	fees: any = {
		feeMake: undefined,
		feeTake: undefined,
		feeRebate: undefined,
		feeMarket:undefined
	};
	marketState: any ;
	state:any={
		orders : undefined,
		myOrders: undefined,
		myTrades: undefined,
		myFunds: undefined
	};
	sha256;
	lastPrice;
	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService, private _marketStorage: LSCXMarketStorageService) {
		this.setMarket();
	}

	setCongif() {
		let file = "";
		this.config= require('../../libs/market-lib/config/'+this.fileName+'.json');
	}

	getAbi(file) {
		if(file!= "market") {
			return require('../../libs/market-lib/smart_contract/'+file+'.sol.json');
		}else{
			return require('../../LSCX-contracts/market.json');
		}
	}

	setToken(token?) {	
		if(typeof(token)=="undefined"){	
			let localToken = this.getLocalStorageToken();
			if(localToken !=null && (this.config.tokens.find(token=>token.addr == localToken.addr) != null || this.marketState.tikers.find(token=>token.addr == localToken.addr))) {
				this.token = localToken;
				
			}else if ( localToken !=null && 'tokens' in this._account.account && this._account.account.tokens.find(token=> token.contractAddress == localToken.addr && !token.deleted && token.network == this._web3.network.chain) != null){
				this.token = localToken;
				
			}else{
				this.token = this.config.tokens[1]; 
			}
		}else{
			this.token = token;
		}
		
		this.saveLocalStorageToken();
		this.setTokenContract();
		this.getTokenState();
		this.resetTokenBalances();
	}

	getLocalStorageToken(){
		if(localStorage.getItem('marketToken')){
			return JSON.parse(localStorage.getItem('marketToken'));
		}else{
			return null;
		}
	}

	saveLocalStorageToken(){
		if(this.token != null && this.token.addr != null){
			localStorage.removeItem('marketToken');
			let obj ={
				addr: this.token.addr,
				balance: this.token.balance,
				decimals: this.token.decimals,
				name: this.token.name
			}
			localStorage.setItem('marketToken', JSON.stringify(obj));
			
		}else{
			localStorage.removeItem('marketToken');	
		}
		let contenido = JSON.parse(localStorage.getItem('marketToken'));
		
	}
	setFileName(){
		this.fileName = this.FILESNAMES[this._web3.network.chain];
	}

	setContracts() {
		this.contractMarket = this._contract.contractInstance(this.getAbi('market'),this.config.contractMarket[0].addr);
		this.contractToken = this._web3.web3.eth.contract(this.getAbi('token'));
		this.contractReserveToken = this._web3.web3.eth.contract(this.getAbi('reservetoken'));
		this.setFees().then();
	}

	async  setFees(){
		let fees = ['feeMake', 'feeTake', 'feeRebate', 'feeMarket'];
		for(let i=0; i<fees.length; i++){
			let fee = await this._contract.callFunction(this.contractMarket, fees[i], []);
			this.fees[fees[i]] = parseInt(fee.toString());
		}
		console.log("FEES", this.fees)
	}

	setTokenContract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}

	async setMarket(token?){
		this.setFileName();
		this.setCongif();
		this.setContracts();
		await this.getLocalState();
		this.eth = this.config.tokens[0];
		this.setToken(token);
		this.setSha256();
	}

	setSha256(){
		
		let abi = [{"constant": true, "inputs": [{"name": "contrato","type": "address"},{"name": "tokenGet","type": "address"},{"name": "amountGet","type": "uint256"},{"name": "tokenGive","type": "address"},
				{"name": "amountGive","type": "uint256"},{"name": "expires","type": "uint256"},{"name": "nonce","type": "uint256"}],
				"name": "gethash", 	"outputs": [{"name": "","type": "bytes32"}],"payable": false,"stateMutability": "pure","type": "function"}]
		let ADDRESSES = {
			1:"0x7b74ad8391111b3d71d95fef3b32b333f1f5d6c0",
			3:"0x338692dfa7a3c6455b25daa831229a949f320844",
			42: "0x648a2D48F05e6E102CccD4037a3448B1c5DF5c24"
		}
		let address = ADDRESSES[this._web3.network.chain]
		this.sha256 = this._contract.contractInstance(abi, address);
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
			if(this.token.contract != null){
				let value = await this._contract.callFunction(this.token.contract, 'balanceOf', [this._account.account.address]);
				let x = value.toString();
				let resBig = new BigNumber(x);
				let y = resBig.div(Math.pow(10,this.token.decimals));
				balance = y.toNumber();
			}
		}
		return balance;
	}

	async orderHash(params) {
		let msgIn = await this._contract.callFunction(this.sha256, 'gethash',params);
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
		const privateKey = (privateKeyIn.toString('hex')).substring(0, 2) === '0x' ? privateKeyIn.substring(2) : privateKeyIn;
		const sig = EthUtil.ecsign(	new Buffer(msgToSign.slice(2), 'hex'), new Buffer(privateKey, 'hex'));
		const r = `0x${sig.r.toString('hex')}`;
		const s = `0x${sig.s.toString('hex')}`;
		const v = sig.v;
		const result = { r, s, v, msg: msgToSign };
		return result;
	}

	async getMarketBalance() {
		let balance = await this._contract.callFunction(this.contractMarket, 'balanceOf', [this.token.addr, this._account.account.address]);
		let balanceBN = new BigNumber(balance.toString());
		let value : number = (balanceBN.div(Math.pow(10,this.token.decimals))).toNumber();

		return value;
	}

	async getMarketEther() {
		let balance = await this._contract.callFunction(this.contractMarket, 'balanceOf', [this.config.tokens[0].addr, this._account.account.address]);
		let value:number = ((new BigNumber(balance.toString())).div(Math.pow(10,18))).toNumber();
		return value
	}

	resetTokenBalances() {
		this.token.balance = null;
		this.marketBalances.token = null;
	}

	async setBalances() {
		this.token.balance = await this.getBalance();
		
		if(this.token.name =="ETH"){
			this.marketBalances.token = await this.getMarketEther();
		}else{
			this.marketBalances.token = await this.getMarketBalance();
		}		
		this.marketBalances.eth = await this.getMarketEther();
	}

	async balancesInterval() {
		return setInterval(async ()=>{
			this.setBalances();
		},2000)
	}

	async getTokenState(){	
		if(this._account.account.address in this.marketState.myFunds){
			this.state.myFunds = this.marketState.myFunds[this._account.account.address].filter(x=>x.tokenAddr == this.token.addr || x.tokenAddr == this.config.tokens[0].addr);
		} else {
			this.state.myFunds = [];
		}
		if(this._account.account.address in this.marketState.myOrders){
			this.state.myOrders = this.marketState.myOrders[this._account.account.address].filter(x=>x.tokenGet == this.token.addr || x.tokenGive== this.token.addr);
		} else {
			this.state.myOrders=[];
		}
		if(this._account.account.address in this.marketState.myTrades){
			this.state.myTrades = this.marketState.myTrades[this._account.account.address].filter(x=>x.tokenGet == this.token.addr || x.tokenGive== this.token.addr);
		} else {
			this.state.myTrades = [];
		}
		this.state.orders = {};
		await this.setBuys();
		await this.setSells();
		console.log("token state", this.state);
	}

	async setBuys() {
		this.state.orders.buys = await this._marketStorage.getBuyOrders(this.token);
	}
	async setSells() {
		this.state.orders.sells = await this._marketStorage.getSellOrders(this.token);
	}
	
	addMyState(obj: any, stateName: string){
		if(this.marketState[stateName].hasOwnProperty(this._account.account.address)){
			this.marketState[stateName][this._account.account.address].push(obj);
		}else{
			this.marketState[stateName][this._account.account.address] = [obj];
		}
		console.log(this.marketState);
		this.saveState();
		this.updateMyStateShow(stateName);
	}

	updateMyStateShow(stateName: string) {
		//Update myFunds, myOrders, or myTrades
		console.log(stateName);
		let interval = null;
		interval = setInterval(()=>{
			let myObj = [];
			if(this._account.account.address in this.marketState[stateName]){
				myObj = this.marketState[stateName][this._account.account.address].filter(fund=> fund.show == false);
			}
				
			if(myObj.length==0){
				clearInterval(interval);
			}else{
				myObj.forEach(obj=> {
					let histTx = this._account.account.history.find(x=> x.hash.toLowerCase() == obj.txHash.toLowerCase());
					console.log(histTx, obj.hash)
					if(histTx!= null ){
						let stop = false;
						for( let i=0; i<this.marketState[stateName][this._account.account.address].length || !stop ; i++){
							if(this.marketState[stateName][this._account.account.address][i].txHash.toLowerCase() ==obj.txHash.toLowerCase()){
								if(histTx.isError == "0") {
									this.marketState[stateName][this._account.account.address][i].show = true;
								}else if(typeof(histTx.isError)!= 'undefined'){
									this.marketState[stateName][this._account.account.address].splice(i,1);
								}
								stop=true;
							}
						}
					}else{
						if(parseInt(this._account.account.history[0].nonce) > obj.nonce){
							console.log("borrar por nonce");
							let stop = false;
							for( let i=0; i<this.marketState[stateName][this._account.account.address].length || !stop ; i++){
								this.marketState[stateName][this._account.account.address].splice(i,1);
								stop = true;
							}
						}
					}
				});
				this.saveState();
			}	
		}, 2000);		
	}

	async checkMyOrdersDeleted(blockNumber:number){
		let myOrders = [];
		if(this._account.account.address in this.marketState.myOrders){
			let myOrdersAddress = this.marketState.myOrders[this._account.account.address]
			myOrders = this.state.myOrders.filter(order=> order.show && !order.deleted);
			console.log()
			myOrders.forEach(async order=>{
				order = new Order(order, order.tokenDecimals);
				console.log("block",blockNumber,"-", order.expires, blockNumber > order.expires)
				if(blockNumber > order.expires){
					console.log("deleted");
					order.deleted = true;
					order.date = Date.now();
				}
				let byte32Zero ="0x0000000000000000000000000000000000000000";
				let filledParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user, 0, byte32Zero, byte32Zero]
				let amountFilled = await this._contract.callFunction(this.contractMarket,'amountFilled', filledParams);
				order.setFilled(amountFilled);

				for(let i=0; i<myOrdersAddress.length; i++){
					if(order.txHash == myOrdersAddress[i].txHash){
						if(order.deleted && order.amountFilled ==0 ){
							myOrdersAddress.splice(i,1);
						} else {		
							myOrdersAddress[i] = order;
						}
					}
				}
				this.marketState.myOrders[this._account.account.address] = myOrdersAddress;
			})
			this.state.myOrders = this.marketState.myOrders[this._account.account.address].filter(x=>x.tokenGet == this.token.addr || x.tokenGive== this.token.addr);
			this.saveState();
		}
	}


	async getLocalState(){
		if(!fs.existsSync(lescovexPath)){
		  fs.mkdirSync(lescovexPath);
		}

		let filePath =lescovexPath+"/."+this.fileName+".json";
		if(!fs.existsSync(filePath)){
			let objNet = {
			tikers:[],
			tikersId: null,
			orders: [],
			myOrders: {},
			myTrades: {},
			myFunds: {}
			}
			fs.writeFileSync(filePath , JSON.stringify(objNet));
		}
		let data = fs.readFileSync(filePath);
		
		this.marketState =  JSON.parse(data);
		console.log("DATA", data, "MARKET", this.marketState)
		await this.getTikers();
		this.updateMyStateShow("myFunds");
		this.updateMyStateShow("myOrders");
		this.updateMyStateShow("myTrades");
	}

	async getTikers(){
		let tikersResult = await this._marketStorage.getTikers(this.marketState.tikersId);
		if(tikersResult!=null){
			tikersResult.tikers.forEach(x=>{
				if(x!= null && this.marketState.tikers.findIndex(y => y.addr === x.addr)==-1){
					this.marketState.tikers.push(x);
				}
			})
			this.marketState.tikersId = tikersResult.tikersId;
			this.saveState();
		}
	}

	/*ESPERANDO AL NUEVO STORAGE MARKET
	async getMarketOrders(){
		console.log("getOrders")
		let ordersResult = await this._marketStorage.getOrders(this.marketState.ordersId);
		if(ordersResult!=null){
			ordersResult.orders.forEach(x=>{
				if(x!= null && this.marketState.orders.findIndex(y => y.addr === x.addr)==-1){
					let tokenAddr=(x.tokenGet!="0x0000000000000000000000000000000000000000") ? x.tokenGet :x.tokenGive;
					//get decimal tokens
					let token = this.config.tokens.find(x=> x.addr == tokenAddr);
					if(token == null){
					token = this.marketState.tikers.find(x=> x.addr == tokenAddr);
					}
					console.log(token)
					if(token!= null) {
						let order = new Order(x, token);
						if(typeof(order.user)!= 'undefined'){
							this.marketState.orders.push(order);
							if(order.user.toLowerCase() == this._account.account.address.toLowerCase()){
								if(this._account.account.address in this.marketState.myOrders){
									this.marketState.myOrders[this._account.account.address].push(order);
								}else{
									this.marketState.myOrders[this._account.account.address] = [order];
								}
							}
						} 
							
					}
				}
			});
			this.marketState.ordersId = ordersResult.ordersId;
			this.saveState();
		}	
	}*/


	saveState(){
		let filePath =lescovexPath+"/."+this.fileName+".json";
		fs.writeFileSync(filePath, JSON.stringify(this.marketState));
	}

	removeAccState(address){
        if(localStorage.getItem('market')) {
			let market = JSON.parse(localStorage.getItem('market'));
			let updatedMarket = market.filter(x=> x.account != address);

			if(updatedMarket == []) {
					localStorage.removeItem('market');
				} else {
					localStorage.setItem('market', JSON.stringify(updatedMarket));
				}
		}
    }

	toWei(eth, decimals){
		return new BigNumber(String(eth))
		.times(new BigNumber(10 ** decimals));
	}

}