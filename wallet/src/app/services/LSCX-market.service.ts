import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { ContractService } from './contract.service';
import { BigNumber } from 'bignumber.js';

import { Order } from '../models/order';
import { Trade } from '../models/trade';

import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../components/dialogs/loading-dialog.component';

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
	//reverseBuys;
	showBuys;
	showSells;

	activeOrdersInterval;
	blockNumber;

	loadingD;

	constructor(private _web3 : Web3, protected dialog: MdDialog, private _account: AccountService, private http: Http, private _contract: ContractService, private _marketStorage: LSCXMarketStorageService) {
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

	async setToken(token?) {
		this.showBuys = null;
		this.showSells = null;
		
		if(this.state.orders != null){
			this.state.orders.buys = null;
			this.state.orders.sells = null;
			this.state.orders = null;
		}
		if(this.activeOrdersInterval != null){
			await this.clearActiveOrdersInterval();
		}
		
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
		this.contractToken = this._web3.web3.eth.contract(this.getAbi('token'));
		this.contractReserveToken = this._web3.web3.eth.contract(this.getAbi('reservetoken'));
		this.setFees().then();
	}

	async setFees(){
		let fees = ['feeMake', 'feeTake', 'feeRebate', 'feeMarket'];
		for(let i=0; i<fees.length; i++){
			let fee;
			try {
				fee = await this._contract.callFunction(this.contractMarket, fees[i], []);	
			} catch (error) {
				console.log(error);
				
			}
			
			this.fees[fees[i]] = parseInt(fee.toString());
		}
		
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
	
		return this._contract.getFunctionData(contract,functionName, params)
	}

	async getBalance() {
		let balance:number = 0;
		if(this.token.name =="ETH"){
			balance = this._account.account.balance
		}else{
			if(this.token.contract != null){
				let value;
				try {
					value = await this._contract.callFunction(this.token.contract, 'balanceOf', [this._account.account.address]);	
				} catch (error) {
					console.log(error);
					
				}
				
				let x = value.toString();
				let resBig = new BigNumber(x);
				let y = resBig.div(Math.pow(10,this.token.decimals));
				balance = y.toNumber();
			}
		}
		return balance;
	}

	async getMarketBalance() {
		let balance;
		try {
			balance = await this._contract.callFunction(this.contractMarket, 'balanceOf', [this.token.addr, this._account.account.address]);	
		} catch (error) {
			console.log(error);
			
		}
		
		let balanceBN = new BigNumber(balance.toString());
		let value : number = (balanceBN.div(Math.pow(10,this.token.decimals))).toNumber();

		return value;
	}

	async getMarketEther() {
		let balance;
		try {
			balance = await this._contract.callFunction(this.contractMarket, 'balanceOf', [this.config.tokens[0].addr, this._account.account.address]);	
		} catch (error) {
			console.log(error);
			
		}
		
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
			this.tikersInterval = setInterval(()=>{
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
		await this.setShowOrders();
		
		
		let blockNum = await this._web3.blockNumber();
        let blockNumber = (typeof(blockNum)== "number")? blockNum : null;
        await this.checkShowSellsDeleted(blockNumber, this._web3.network.chain); //updateShowBuys
		await this.checkShowBuysDeleted(blockNumber, this._web3.network.chain);  //updateShowSells
		if(this.loadingD != null){
			this.loadingD.close();
		}
	}

	async setBuys() {
		try {
			this.state.orders.buys = await this._marketStorage.getBuyOrders(this.token);	
		} catch (error) {
			console.log(error);
			this.setBuys();
		}
		
		console.log("BUYS",this.state.orders.buys)

	}

	async setSells() {
		try {
			this.state.orders.sells = await this._marketStorage.getSellOrders(this.token);	
		} catch (error) {
			console.log(error);
			this.setSells();
		}
		
		console.log("SELLS",this.state.orders.sells)
	}

	async setShowOrders(){
		let x = this.state.orders.buys
		this.showBuys = await this.orderByPrice(x);
		this.showSells = this.state.orders.sells;
	}
	orderByPrice(object){
        
		object.sort(function (a, b) {
		  if ( a.price > b.price )
			return -1;
		  if ( a.price < b.price )
			return 1;
			return 0;
		})
	  
	  return object;
	}	
	
	addMyState(obj: any, stateName: string){ //revisarFuncion
		if(this.marketState[stateName].hasOwnProperty(this._account.account.address)){
			this.marketState[stateName][this._account.account.address].push(obj);
		}else{
			this.marketState[stateName][this._account.account.address] = [obj];
		}
		
		this.saveState();
		
		this.updateMyStateShow(stateName);
	}

	updateMyStateShow(stateName: string) { // revisar funcion
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
			let myOrdersAddress = this.marketState.myOrders[this._account.account.address];

			myOrders = this.state.myOrders.filter(order=> order.show && !order.deleted);
			myOrders.forEach(async order=>{
				order = new Order(order, order.tokenDecimals);
				if(blockNumber > order.expires){
					order.deleted = true;
					order.date = Date.now();
				}
				let filledParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user]
				let amountFilled;
				try {
					amountFilled = await this._contract.callFunction(this.contractMarket,'amountFilled', filledParams);	
				} catch (error) {
					console.log(error);
					this.checkMyOrdersDeleted(blockNumber, network)
				}
				
				order.setFilled(amountFilled);

				for(let i=0; i<myOrdersAddress.length; i++){
					if(order.txHash == myOrdersAddress[i].txHash){
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

	async checkShowSellsDeleted(blockNumber:number, network: number){
		let myOrders = [];
		let myNewOrders = [];
		if(network == this._web3.network.chain){
			try {
				myOrders = await this._marketStorage.getSellOrders(this.token);	
			} catch (error) {
				this.checkShowSellsDeleted(blockNumber, network);
			}
			
			if(myOrders != null){
				for (let i = 0; i < myOrders.length; i++) {
					let order = new Order(myOrders[i], myOrders[i].tokenDecimals);
					if(blockNumber > order.expires){
						order.deleted = true;
						order.date = Date.now();
					}
					let filledParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user];
					let amountFilled;
					try {
						amountFilled = await this._contract.callFunction(this.contractMarket,'amountFilled', filledParams);	
					} catch (error) {
						console.log(error);
						this.checkShowSellsDeleted(blockNumber, network);
					}
				
					order.setFilled(amountFilled);
					if(order.deleted && order.amountFilled == 0 ){
						//myOrders.splice(i,1);
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
						
						//myOrders.splice(i,1);
						
					} else {		
						myNewOrders.push(order);
					}
				}
	
				if(this._web3.network.chain == network) {
					myOrders = await myNewOrders;
					if(myNewOrders.length > 0){
						if(this.token.addr == myNewOrders[0].tokenGive){
							this.showSells = myOrders;
							this.marketState.showSells = this.showSells;
							this.saveState();
						}
					}
				}
			}
		}
	}

	async checkShowBuysDeleted(blockNumber:number, network: number){
		let myOrders = [];
		let myNewOrders = [];
		if(network == this._web3.network.chain){
			let buys;
			try {
				buys = await this._marketStorage.getBuyOrders(this.token);	
			} catch (error) {
				console.log(error);
				this.checkShowBuysDeleted(blockNumber, network);
			}
			
			myOrders = await this.orderByPrice(buys);
			if(myOrders != null){
				for (let i = 0; i < myOrders.length; i++) {
					//const element = array[i];
					let order = new Order(myOrders[i], myOrders[i].tokenDecimals);
					if(blockNumber > order.expires){
						order.deleted = true;
						order.date = Date.now();
					}
					let filledParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user]
					let amountFilled;
					try {
						amountFilled = await this._contract.callFunction(this.contractMarket,'amountFilled', filledParams);	
					} catch (error) {
						console.log(error);
						this.checkShowBuysDeleted(blockNumber, network)
					}
					
					order.setFilled(amountFilled); //Order Model
					if(order.deleted && order.amountFilled == 0 ){
						//myOrders.splice(i,1);
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
						
						//myOrders.splice(i,1);
						
					} else {		
						myNewOrders.push(order);
					}
				}
					
				if(this._web3.network.chain == network) {
					myOrders = await myNewOrders;
					if(myNewOrders.length > 0){
						if(this.token.addr == myNewOrders[0].tokenGet){
						
							this.showBuys = myOrders;
							this.marketState.showBuys = this.showBuys;
							this.saveState();
						}
					}
				}
			}
		}
	}

	async getLocalState(){
		if(!fs.existsSync(lescovexPath)){
		  fs.mkdirSync(lescovexPath);
		}
		
		let filePath = lescovexPath+"/."+this.fileName+".json";
		
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
		try {
			this.marketState =  JSON.parse(data);
		} catch (error) {
			console.log(error);
			fs.unlink(filePath, (err) => {
				if (err) throw err;
				console.log('successfully deleted', filePath);
			  });
			this.getLocalState();
		}
			await this.getTikers();
			this.updateMyStateShow("myFunds");
			this.updateMyStateShow("myOrders");
			this.updateMyStateShow("myTrades");

	}

	async getTikers(){
		//REVISAR TIKERS!!!!!
		
		let tikersResult;
		try {
			tikersResult = await this._marketStorage.getTikers(this.marketState.tikersId);	
			console.log("tikersResult",tikersResult);
			
		} catch (error) {
			console.log(error);
			this.getTikers();
		}
		
		if(tikersResult!=null && tikersResult.network == this._web3.network.chain){
			
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
		let filePath =lescovexPath+"/."+this.fileName+".json";
		try {
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

	startActiveOrdersInterval(){
		this.activeOrdersInterval = setInterval(async()=>{
			let blockNum = await this._web3.blockNumber();
			this.blockNumber = (typeof(blockNum)== "number")? blockNum : null;
			this.checkShowSellsDeleted(this.blockNumber, this._web3.network.chain); //updateShowBuys
			this.checkShowBuysDeleted(this.blockNumber, this._web3.network.chain);  //updateShowSells
			
		},5000);
	}

	clearActiveOrdersInterval(){
		clearInterval(this.activeOrdersInterval);
	}

	activateLoading(){
		Promise.resolve().then(() => {
		  this.loadingD = this.dialog.open(LoadingDialogComponent, {
			width: '660px',
			height: '150px',
			disableClose: true,
		  });
		});
	  }

}