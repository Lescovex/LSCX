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
	updated: boolean;

	balancesInterval = null;
	stateOrdersInteval = null;
	tikersInterval = null;
	
	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _contract: ContractService, private _marketStorage: LSCXMarketStorageService) {
		this.updated = false;
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
			} else {
				this.token = this.config.tokens[1]; 
			}
		}else{
			this.token = {addr: token.addr, name: token.name, decimals: token.decimals}
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
		console.log("THIS CONTRACT MARKET?",this.contractMarket);
		
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
		//console.log("FEES", this.fees)
	}

	setTokenContract() {
		this.token.contract = this.contractToken.at(this.token.addr)
	}

	async setMarket(token?){
		this.setFileName();
		this.setCongif();
		this.setContracts();
		this._marketStorage.setContract();
		this.clearTikersInterval();
		await this.getLocalState();
		this.eth = this.config.tokens[0];
		this.setToken(token);
		this.updated = true;
	}

	getFunctionData(contract, functionName:string, params?) {
		if(typeof(params)== 'undefined'){
			params= []
		}
		//console.log("this.functionData", this._contract.getFunctionData(contract, functionName, params));
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

	async setBalancesInterval() {
		this.balancesInterval = setInterval(async ()=>{
			await this.setBalances();
		},2000)
	}

	clearBalancesInterval(){
		clearInterval(this.balancesInterval);
		this.balancesInterval = null;
	}

	setStateOrdersInterval(){
		this.stateOrdersInteval = setInterval(()=>{
			  this.setSells();
			  this.setBuys();
		},5000);
	}

	clearStateOrdersInterval(){
		clearInterval(this.stateOrdersInteval);
		this.stateOrdersInteval = null;
	}

	async setTikersInterval(){
		if(this.tikersInterval== null){
			this.getTikers();
			console.log("tikersInterval");
			this.tikersInterval = setInterval(()=>{
				console.log("tikersInterval");
				this.getTikers();
			  },60000);
		}
	}

	clearTikersInterval(){
		clearInterval(this.tikersInterval);
		this.tikersInterval = null;
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
			this.state.myTrades = this.marketState.myTrades[this._account.account.address].filter(x=>x.tokenAddr == this.token.addr);
		} else {
			this.state.myTrades = [];
		}
		this.state.orders = {buys:[], sells:[]};
		await this.setBuys();
		await this.setSells();
	}

	async setBuys() {
		this.state.orders.buys = await this._marketStorage.getBuyOrders(this.token);
		console.log("BUYS",this.state.orders.buys)
	}
	async setSells() {
		this.state.orders.sells = await this._marketStorage.getSellOrders(this.token);
		console.log("SELLS",this.state.orders.sells)
	}
	
	addMyState(obj: any, stateName: string){
		if(this.marketState[stateName].hasOwnProperty(this._account.account.address)){
			this.marketState[stateName][this._account.account.address].push(obj);
		}else{
			this.marketState[stateName][this._account.account.address] = [obj];
		}
		//console.log("antes de save");
		this.saveState();
		//console.log("despues de save");
		this.updateMyStateShow(stateName);
	}

	updateMyStateShow(stateName: string) {
		//Update myFunds, myOrders, or myTrades
		//console.log("entra en update", stateName);
		let interval = null;
		interval = setInterval(()=>{
			let myObjs = [];
			if(this._account.account.address in this.marketState[stateName]){
				myObjs = this.marketState[stateName][this._account.account.address].filter(fund=> fund.show == false);
			}
				
			if(myObjs.length==0){
				clearInterval(interval);
			}else{
				myObjs.forEach(obj=> {
					let histTx = this._account.account.history.find(x=> x.hash.toLowerCase() == obj.txHash.toLowerCase());
					console.log("busca confirmacion de tx")
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

	async checkMyOrdersDeleted(blockNumber:number, network: number){

		let myOrders = [];
		if(this._account.account.address in this.marketState.myOrders && network == this._web3.network.chain){
			let myOrdersAddress = this.marketState.myOrders[this._account.account.address]
			myOrders = this.state.myOrders.filter(order=> order.show && !order.deleted);
			myOrders.forEach(async order=>{
				order = new Order(order, order.tokenDecimals);
				if(blockNumber > order.expires){
					order.deleted = true;
					order.date = Date.now();
				}
				let filledParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user]
				let amountFilled = await this._contract.callFunction(this.contractMarket,'amountFilled', filledParams);
				order.setFilled(amountFilled);

				for(let i=0; i<myOrdersAddress.length; i++){
					if(order.txHash == myOrdersAddress[i].txHash){
						console.log(order.deleted, order.amountFilled, )
						if(order.deleted && order.amountFilled == 0 ){
							myOrdersAddress.splice(i,1);
						} else if (order.deleted && order.amountFilled > 0 || order.available == 0) {
							let side: string;
							let amount: number;
							let amountBase: number;
							if(order.tokenGet == this.config.tokens[0].addr) {
								side = "sell";
								amount = order.amountFilled/order.price;
								amountBase =  order.amountFilled;
							} else {
								side = "buy";
								amount = order.amountFilled;
								amountBase = order.amountFilled * order.price;
							}
							let trade = new Trade(side, order.tokenGet, order.tokenGive, amount, amountBase, order.price, this._account.account.address, order.user, order.nonce);
							trade.txHash = order.txHash;
							myOrdersAddress.splice(i,1);
							//add to myTrades and remove from myOrders
							if(this._web3.network.chain == network) {
								if(this._account.account.address in this.marketState.myTrades){
									this.marketState.myTrades[this._account.account.address].push(trade);
								} else {
									this.marketState.myTrades[this._account.account.address] = [trade]
								}
								this.state.myTrades.push(trade);
							}
						} else {		
							myOrdersAddress[i] = order;
						}
					}
				}
				if(this._web3.network.chain == network) {
					this.marketState.myOrders[this._account.account.address] = myOrdersAddress;
				}	
			})
			if(this._web3.network.chain == network) {
				this.state.myOrders = this.marketState.myOrders[this._account.account.address].filter(x=>x.tokenGet == this.token.addr || x.tokenGive== this.token.addr);
				this.saveState();
			}
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
			tikersTolist:[],
			myOrders: {},
			myTrades: {},
			myFunds: {}
			}
			fs.writeFileSync(filePath , JSON.stringify(objNet));
		}
		let data = fs.readFileSync(filePath);
		
		this.marketState =  JSON.parse(data);
		//console.log("MARKET", this.marketState);
		await this.getTikers();
		this.updateMyStateShow("myFunds");
		this.updateMyStateShow("myOrders");
		this.updateMyStateShow("myTrades");
	}

	async getTikers(){
		let tikersResult = await this._marketStorage.getTikers(this.marketState.tikersId);

		if(tikersResult!=null && tikersResult.network == this._web3.network.chain){
			console.log("entra en tikers");
			tikersResult.tikers.forEach(x=>{
				if(x!= null && this.marketState.tikers.findIndex(y => y.addr === x.addr)==-1){
					if(tikersResult.network == this._web3.network.chain){
						this.marketState.tikers.push(x);
					}
				}
			})
			if(tikersResult.network == this._web3.network.chain){
				this.marketState.tikersId = tikersResult.tikersId;
				this.saveState();
			}
		}
	}

	addTikerToList(tiker){
		console.log("ADD TIKER TO LIST");
		console.log("tiker to add!!!!!", tiker);				
		if(this.marketState.hasOwnProperty('tikersToList')){
			this.marketState.tikersToList.push(tiker);
		}else{
			this.marketState.tikersToList = [tiker]
		}
		this.saveState();
		this.updateTikersToList();

	}
	
	updateTikersToList(){
		let interval = null;
		interval = setInterval(()=>{
			if('tikersToList' in this.marketState){
				let tikersToList = this.marketState.tikersToList.filter(x=>{
					let result = this.marketState.tikers.findIndex(y=> y.addr == x.addr);
					return result == -1;
				});
				this.marketState.tikersToList =  tikersToList;
				this.saveState();

				if( tikersToList.length==0){
					clearInterval(interval);
				} else {
					let myTikersToList = this.marketState.tikersToList.filter(x=>x.account == this._account.account.address);
					if(myTikersToList.length == 0){
						clearInterval(interval);
					}else{
						myTikersToList.forEach(tiker=>{
							let histTx = this._account.account.history.find(x=> x.hash.toLowerCase() == tiker.txHash.toLowerCase());
							if(histTx!= null ){
								let stop = false;
								for(let i=0; i<tikersToList.length || !stop; i++){
									if(histTx.isError == "0") {
										this.getTikers();
									} else if(typeof(histTx.isError)!= 'undefined'){ 
										tikersToList.splice(i,1);
									}
									stop=true;
								}
							} else {
								if(parseInt(this._account.account.history[0].nonce) > tiker.nonce){
									let stop = false;
									for( let i=0; i<tikersToList.length || !stop ; i++){
										tikersToList.splice(i,1);
										stop = true;
									}
								}
							}
						});
					}
					this.saveState();
				}
			}
		}, 2000);
	}
	saveState(){
		//console.log("SAVE STATEEEEEEEEE")
		let filePath =lescovexPath+"/."+this.fileName+".json";
		try {
			//console.log("MARKET", this.marketState);
			JSON.stringify(this.marketState);
		}catch (e)  {
			console.log("JSON ERROR", e)
		}
		try{
			fs.writeFileSync(filePath, JSON.stringify(this.marketState));
		}catch(e) {
			console.log("FILESYNC ERROR",e);
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