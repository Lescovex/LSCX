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
	socket;
	fees: any = {
		feeMake: undefined,
		feeTake: undefined,
		feeRebate: undefined,
		feeMarket:undefined
	};
	marketState: any ;
	state:any;
	sha256;
	lastPrice;
	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService) {
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
		/*let fee = await this._contract.callFunction(this.contractMarket, 'feeMake', [])
		this.fees.feeMake = parseInt(fee.toString());
		this.fees.feeTake = await this._contract.callFunction(this.contractMarket, 'feeTake', []);
		this.fees.feeRebate = await this._contract.callFunction(this.contractMarket, 'feeRebate', []);
		this.fees.feeMarket = await this._contract.callFunction(this.contractMarket, 'feeMarket', []);*/
		console.log("FEES", this.fees)

	}

	setTokenContract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}

	setMarket(token?){
		this.setFileName();
		this.setCongif();
		this.setContracts();
		this.getLocalState();
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
		let value : number = parseInt(balance.toString())/Math.pow(10,this.token.decimals);
		return value;
	}

	async getMarketEther() {
		let balance = await this._contract.callFunction(this.contractMarket, 'balanceOf', [this.config.tokens[0].addr, this._account.account.address]);
		let value:number = parseInt(balance.toString())/Math.pow(10,18);
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

	
	updateFunds(funds){
		let self = this;
		let newFunds = funds.map(function(x) {
			let net =(self._web3.network==1)? '' : 'ropsten.'
			let txLink = "https://"+net+"etherscan.io/tx/" + x.txHash;
			return Object.assign(x, {
				txLink: txLink,
				txHash: x.txHash,
				date: new Date(x.date),
				amount: Number(x.amount),
				price: Number(x.price)
			})
		})
		if (typeof(this.marketState.myFunds)=="undefined") this.marketState.myFunds = [];
		newFunds.forEach(x=>{
			if(this.marketState.myFunds.findIndex(y => y.txHash === x.txHash)==-1){
				this.marketState.myFunds.push(x);
			}
		})
	}
	
	/*updateOrders(newOrders, token, user){
		
		const newOrdersTransformed = {
		  buys: newOrders.buys
			.map(x => x = new Order(x, 'buy', token)
			),
		  sells: newOrders.sells
		  .map(x => x = new Order(x, 'sell', token)
		  ),
		};
		if (typeof(this.marketState.orders)=="undefined") this.marketState.orders = { buys: [], sells: [] };
		if (typeof(this.marketState.myOrders)=="undefined") this.marketState.myOrders = { buys: [], sells: [] };
		this.compareOrders(newOrdersTransformed, 'buys');
		
		this.compareOrders(newOrdersTransformed, 'sells');
		this.marketState.orders = {
		  sells: this.marketState.orders.sells.sort((a, b) =>
			a.price - b.price || a.amountGet - b.amountGet),
		  buys: this.marketState.orders.buys.sort((a, b) =>
			b.price - a.price || b.amountGet - a.amountGet),
		};
		this.marketState.myOrders = {
		  sells: this.marketState.myOrders.sells.sort((a, b) =>
			a.price - b.price || a.amountGet - b.amountGet),
		  buys: this.marketState.myOrders.buys.sort((a, b) =>
			b.price - a.price || b.amountGet - a.amountGet),
		};
	};*/

	compareOrders(newOrdersTransformed, type){
		newOrdersTransformed[type].forEach((x) => {
			if (x.deleted == true || x.ethAvailableVolumeBase < this.config.minOrderSize) {
				this.marketState.orders[type] = this.marketState.orders[type].filter(y => y.id !== x.id);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.marketState.myOrders[type] = this.marketState.myOrders[type].filter(y => y.id !== x.id);
				}
			} else if (this.marketState.orders[type].findIndex(y => y.id === x.id)!=-1) {
				this.marketState.orders[type] = this.marketState.orders[type].map(y => (y.id === x.id ? x : y));
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.marketState.myOrders[type] = this.marketState.myOrders[type].map(y => (y.id === x.id ? x : y));
				}
			} else {
				this.marketState.orders[type].push(x);
				x.user.toLowerCase() === this._account.account.address.toLowerCase()
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.marketState.myOrders[type].push(x);
				}
			}
		});
	}

	updateTrades(newTrades, token, user) {
		const newTradesTransformed = newTrades
		.map(x => x = new Trade(x));
		if (typeof(this.marketState.trades)=="undefined") this.marketState.trades = [];
		if (typeof(this.marketState.myTrades)=="undefined") this.marketState.myTrades = [];
		newTradesTransformed.forEach((x) => {
			if (this.marketState.myTrades.findIndex(y => y.txHash === x.txHash)==-1) {
				if (x.buyer.toLowerCase() === this._account.account.address.toLowerCase() ||
				x.seller.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.marketState.myTrades.push(x);
				}
			};
		});
		this.marketState.myTrades = this.marketState.myTrades
		  .sort((a, b) => b.date.getTime() -a.date.getTime() || b.amount - a.amount);	
	}

	async getLocalState(){
		if(!fs.existsSync(lescovexPath)){
		  fs.mkdirSync(lescovexPath);
		}

		let filePath =lescovexPath+"/."+this.fileName+".json";
		if(!fs.existsSync(filePath)){
			let objNet = {
			tikers:[],
			orders: [],
			lasId:null,
			myOrders: [],
			myTrades: [],
			myFunds: []
			}
			fs.writeFileSync(filePath , JSON.stringify(objNet));
		}
		let data = fs.readFileSync(filePath);
		this.marketState =  JSON.parse(data);
		console.log(this.fileName, this.marketState);
		await this.getTikers();	
		console.log(this.marketState)
		
	}

	async getTikers(){
		let filePath =lescovexPath+"/."+this.fileName+".json";
		console.log("ids")
		let idsResult = await this._contract.callFunction(this.contractMarket,'tikersId',[]);
		let i = this.marketState.tikers.length;
		let ids = parseInt(idsResult.toString());
		let tikers = this.marketState.tikers;
		console.log(i, ids)
		for(i ; i<ids; i++) {

			let tiker = await this._contract.callFunction(this.contractMarket, 'tikers', [i]);
			let tikerObj = {addr : tiker['0'], "name":tiker['1'],"decimals":tiker['2'].toNumber()}
			tikers.push(tikerObj);
			if(i== (ids-1)){
				this.marketState.tikers = tikers;
				fs.writeFileSync(filePath, JSON.stringify(this.marketState));
			}
		}	
	}
	async getMarketOrders(){
		let filePath =lescovexPath+"/."+this.fileName+".json";
		console.log("ids")
		let idsResult = await this._contract.callFunction(this.contractMarket,'id',[]);
		let lastId = this.marketState.lastId;
		let i = 0;
		if(lastId!=null){
			i = lastId+1;
		}
		let ids = parseInt(idsResult.toString());
		console.log(i, ids)
		for(i ; i<ids; i++) {

			let orderResult = await this._contract.callFunction(this.contractMarket, 'ordersInfo', [i]);
			let tokenAddr=(orderResult['1']!="0x0000000000000000000000000000000000000000") ? orderResult['1'] :orderResult['3'];
			//get decimal tokens
			let token = this.config.tokens.find(x=> x.addr == tokenAddr);
			if(token == null){
				token = this.marketState.tikers.find(x=> x.addr == tokenAddr);
			}
			if(token!= null) {

			}
			let order = new Order(orderResult, token.decimals);
			this.marketState.orders.push(order);
			if(i== (ids-1)){
				this.marketState.lastId = i;
				fs.writeFileSync(filePath, JSON.stringify(this.marketState));

			}
		}	
	}

	/*saveState() {
		let tokenStatus ={
			myOrders: this.state.myOrders,
			myTrades: this.state.myTrades
		}
		if(localStorage.getItem('market')){
			let market = JSON.parse(localStorage.getItem('market'));
			let index = market.findIndex(x=>x.account.toLowerCase() == this._account.account.address.toLowerCase());
			if(index==-1){
				let marketObj: any = {
					account: this._account.account.address,
					myFunds: this.state.myFunds
				}
				marketObj[this._web3.network.chain.toString()]={}
				marketObj[this._web3.network.chain.toString()][this.token.addr] = tokenStatus;
				market.push(marketObj);
			}else if(this._web3.network.chain.toString() in market[index]){
				market[index][this._web3.network.chain.toString()][this.token.addr] = tokenStatus;
			}else{
				market[index][this._web3.network.chain.toString()]={}
				market[index][this._web3.network.chain.toString()][this.token.addr] = tokenStatus;
			}
			localStorage.setItem('market', JSON.stringify(market))
		}else{
			let marketObj: any = {
				account: this._account.account.address,
				myFunds: this.state.myFunds
			}
			marketObj[this._web3.network.chain.toString()]={}
			marketObj[this._web3.network.chain.toString()][this.token.address] = tokenStatus;
			localStorage.setItem('market', JSON.stringify([marketObj]))
		}
	}*/

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