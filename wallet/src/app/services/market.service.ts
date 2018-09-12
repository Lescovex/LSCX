import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

import { Order } from '../models/order';
import { Trade } from '../models/trade';

const io = require('socket.io-client');


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
		this.socket = io.connect(this.config.socketServer[0], { transports: ['websocket'] });
		
		this.socket.on('connect', () => {
			console.log('socket connected', this.socket);
	  	});
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
				this.socket.on('orders', (orders) => {
				  	this.updateOrders(orders, this.token, this._account.account.address);
				});
				this.socket.on('trades', (trades) => {
					this.updateTrades(trades, this.token, this._account.account.address);
				});
				console.log(this.state)
				  clearInterval(interval);
			}else{
				console.log('aqui estamos')
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
	};

	compareOrders(newOrdersTransformed, type){
		newOrdersTransformed[type].forEach((x) => {
			if ('deleted' in x || x.ethAvailableVolumeBase <= this.config.minOrderSize) {
				this.state.orders[type] = this.state.orders[type].filter(y => y.id !== x.id);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type] = this.state.myOrders[type].filter(y => y.id !== x.id);
				}
			} else if (this.state.orders[type].find(y => y.id === x.id)) {
				this.state.orders[type] = this.state.orders[type].map(y => (y.id === x.id ? x : y));
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type] = this.state.myOrders[type].map(y => (y.id === x.id ? x : y));
				}
			} else {
				this.state.orders[type].push(x);
				if (x.user.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myOrders[type].push(x);
				}
			}
		});
	}
	
	updateTrades(newTrades, token, user) {
		const newTradesTransformed = newTrades
		.map(x => x = new Trade(x));
	
		if (!this.state.trades) this.state.trades = [];
		if (!this.state.myTrades) this.state.myTrades = [];
		newTradesTransformed.forEach((x) => {
			if (!this.state.trades.find(y => y.txHash === x.txHash)) {
				this.state.trades.push(x);
				if (x.buyer.toLowerCase() === this._account.account.address.toLowerCase() ||
				x.seller.toLowerCase() === this._account.account.address.toLowerCase()) {
				this.state.myTrades.push(x);
				}
			};
		});
		/*this.state.trades = this.state.trades
		  .sort((a, b) => new Date(b.date) - new Date(a.date) || b.amount - a.amount);
		this.state.myTrades = this.state.myTrades
		  .sort((a, b) => new Date(b.date) - new Date(a.date) || b.amount - a.amount);*/
	
	}
	
	toWei(eth, decimals){
		return new BigNumber(String(eth))
		.times(new BigNumber(10 ** decimals));
	}
}