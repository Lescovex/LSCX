import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

import { Order } from '../models/order';
import { Trade } from '../models/trade';

declare var require: any;
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
		initialState: false,
		orders: undefined,
		trades: undefined,
		myOrders: undefined,
		myTrades: undefined,
		myFunds: undefined,
	};
	sha256;
	lastPrice;
	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService, ) {
		
	}

	setCongif() {
		let file = (this._web3.network == 1)? 'main': 'testnet';
		this.config= require('../../libs/market-lib/config/'+file+'.json');
	}

	getAbi(file) {
		return require('../../libs/market-lib/smart_contract/'+file+'.sol.json');
	}

	setToken(token?) {		
		if(typeof(token)=="undefined"){	
			let localToken = this.getLocalStorageToken();
			
			if(localToken !=null && this.config.tokens.find(token=>token.addr == localToken.addr) != null){
				this.token = localToken;
				
			}else if ( localToken !=null && 'tokens' in this._account.account && this._account.account.tokens.find(token=> token.contractAddress == localToken.addr && !token.deleted && token.network == this._web3.network) != null){
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

	setContracts() {	
		this.contractEtherDelta = this._contract.contractInstance(this.getAbi('etherdelta'),this.config.contractEtherDeltaAddrs[0].addr);
		this.contractToken = this._web3.web3.eth.contract(this.getAbi('token'));
		this.contractReserveToken = this._web3.web3.eth.contract(this.getAbi('reservetoken'));
	}

	setTokenContract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}

	setMarket(token?){
		this.setCongif();
		this.setContracts();
		this.eth = this.config.tokens[0];
		this.setToken(token);
		this.getLocalState();
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
		
		});
		this.waitForMarket();
	}

	async resetSocket(token?) {
		
		this.socket.close();
		this.state = {
			initialState: false,
			trades: undefined,
			myTrades: undefined,
			orders : undefined,
			myOrders: undefined,
		};
		if(typeof(token)== 'undefined'){	
			this.setToken();
		}else{
			
			if(token.addr != null){
				this.setToken(token)
			}else{
				this.setToken();
			}
		}
		await this.setSocket();
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
			if('orders' in market && 'trades' in market){
			
				this.updateOrders(market.orders, this.token, this._account.account.address);
				this.updateTrades(market.trades, this.token, this._account.account.address);
				this.state.initialState = true;
				
				let len;
				len = market.trades.length
				if(len > 0){
					this.lastPrice = market.trades[len-1].price;
				}
				this.socket.on('orders', (orders) => {
			
				  	this.updateOrders(orders, this.token, this._account.account.address);
				});
				this.socket.on('trades', (trades) => {
			
					this.updateTrades(trades, this.token, this._account.account.address);
				});
				if('myOrders' in market){

				}
				if('myTrades' in market){

				}
				if('myFunds' in market){
					this.updateFunds(market.myFunds);
					this.socket.on('myFunds', (myFunds) => {
						this.updateFunds(market.myFunds);
				  });
				}
				this.saveState();
				clearInterval(interval);
			} else {
				interval = setTimeout(() => {
					this.getMarketAndWait();
				}, 2000);
			}		
		});
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
		if (typeof(this.state.myFunds)=="undefined") this.state.myFunds = [];
		newFunds.forEach(x=>{
			if(this.state.myFunds.findIndex(y => y.txHash === x.txHash)==-1){
				this.state.myFunds.push(x);
			}
		})
	}
	
	updateOrders(newOrders, token, user){
		
		const newOrdersTransformed = {
		  buys: newOrders.buys
			.map(x => x = new Order(x, 'buy', token)
			),
		  sells: newOrders.sells
		  .map(x => x = new Order(x, 'sell', token)
		  ),
		};
		if (typeof(this.state.orders)=="undefined") this.state.orders = { buys: [], sells: [] };
		if (typeof(this.state.myOrders)=="undefined") this.state.myOrders = { buys: [], sells: [] };
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
	};

	compareOrders(newOrdersTransformed, type){
		newOrdersTransformed[type].forEach((x) => {
			if (x.deleted == true || x.ethAvailableVolumeBase < this.config.minOrderSize) {
				this.state.orders[type] = this.state.orders[type].filter(y => y.id !== x.id);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.state.myOrders[type] = this.state.myOrders[type].filter(y => y.id !== x.id);
				}
			} else if (this.state.orders[type].findIndex(y => y.id === x.id)!=-1) {
				this.state.orders[type] = this.state.orders[type].map(y => (y.id === x.id ? x : y));
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.state.myOrders[type] = this.state.myOrders[type].map(y => (y.id === x.id ? x : y));
				}
			} else {
				this.state.orders[type].push(x);
				x.user.toLowerCase() === this._account.account.address.toLowerCase()
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
					this.state.myOrders[type].push(x);
				}
			}
		});
	}

	updateTrades(newTrades, token, user) {
		const newTradesTransformed = newTrades
		.map(x => x = new Trade(x));
		if (typeof(this.state.trades)=="undefined") this.state.trades = [];
		if (typeof(this.state.myTrades)=="undefined") this.state.myTrades = [];
		newTradesTransformed.forEach((x) => {
			if (this.state.myTrades.findIndex(y => y.txHash === x.txHash)==-1) {
				if (x.buyer.toLowerCase() === this._account.account.address.toLowerCase() ||
				x.seller.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myTrades.push(x);
				}
			};
		});
		this.state.myTrades = this.state.myTrades
		  .sort((a, b) => b.date.getTime() -a.date.getTime() || b.amount - a.amount);	
	}

	getLocalState() {
		
		if(localStorage.getItem('market')){	
			let market = JSON.parse(localStorage.getItem('market'));
			let index = market.findIndex(x=>x.account.toLowerCase() == this._account.account.address.toLowerCase()&& this._web3.network.toString() in x);
			if(index != -1){
				
				if('myFunds' in market[index][this._web3.network.toString()]) {
					this.state.myFunds = market[index][this._web3.network.toString()].myFunds.filter(x=>x.tokenAddr==0x0000000000000000000000000000000000000000 ||x.token.Addr==this.token.addr)

				}
				if(this.token.addr in market[index][this._web3.network.toString()]){
					
					this.state.myOrders = market[index][this._web3.network.toString()][this.token.addr].myOrders;
					this.state.myTrades = market[index][this._web3.network.toString()][this.token.addr].myTrades;
				}
			}
		}
	}

	saveState() {
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
				marketObj[this._web3.network.toString()]={}
				marketObj[this._web3.network.toString()][this.token.addr] = tokenStatus;
				market.push(marketObj);
			}else if(this._web3.network.toString() in market[index]){
				market[index][this._web3.network.toString()][this.token.addr] = tokenStatus;
			}else{
				market[index][this._web3.network.toString()]={}
				market[index][this._web3.network.toString()][this.token.addr] = tokenStatus;
			}
			localStorage.setItem('market', JSON.stringify(market))
		}else{
			let marketObj: any = {
				account: this._account.account.address,
				myFunds: this.state.myFunds
			}
			marketObj[this._web3.network.toString()]={}
			marketObj[this._web3.network.toString()][this.token.address] = tokenStatus;
			localStorage.setItem('market', JSON.stringify([marketObj]))
		}
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