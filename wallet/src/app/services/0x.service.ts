import { Injectable} from '@angular/core';
import { Router } from '@angular/router'
import { MdDialog } from '@angular/material';
import { Http, Headers, RequestOptions } from "@angular/http";

//services
import { WalletService } from './wallet.service';
import { AccountService } from "./account.service";
import { TokenService } from './token.service';
import { Web3 } from "./web3.service";
import { ContractService } from './contract.service';
import { EtherscanService } from './etherscan.service';


import { LoadingDialogComponent } from '../components/dialogs/loading-dialog.component';

//0x imports
import { assetDataUtils, BigNumber, ContractWrappers, generatePseudoRandomSalt, Order, orderHashUtils, signatureUtils} from '0x.js';
import { RedundantSubprovider, RPCSubprovider, SignerSubprovider, Web3ProviderEngine, PrivateKeyWalletSubprovider } from '@0x/subproviders';
import { HttpClient, OrderbookRequest, OrderConfigRequest, OrderbookResponse, SignedOrder } from '@0x/connect';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses/lib/src';

import * as Web3L from 'web3';
import * as EthWallet from 'ethereumjs-wallet';

@Injectable()
export class ZeroExService{
  protected providerEngine;
  protected providerAddress = "https://api.openrelay.xyz/v2/";
  //protected providerAddress = "http://0x.lescovex.com/v2";
  protected web3;
  protected infuraKey = "d975dfec3852411890cd72311dd91184";

  //WETH Config
  protected WETH_addr;
  protected WETH_abi;
  public contract;
  public balance_weth;
  public contractAddresses;
  protected contractWrappers;
  protected httpClient;
  protected signerSubprovider;
  protected subproviders;
  
  protected privateKeyWalletSubprovider;
  protected web3Wrapper;

  protected DECIMALS = 18;
  
  public interval;
  public loadingD;

  public orderbook = [];
  public selectedPair = [];
  public asset_pairs = [];
  public contractToken;
  public token: any;
  constructor(private http: Http, public _account: AccountService, private _wallet : WalletService, protected dialog: MdDialog, private _token : TokenService, private _web3: Web3, private router: Router, private _scan: EtherscanService, private _contract: ContractService){
    
    this.init();
    
  }
  /*
  async test(){
    let tokenAddr = "0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa";
    let result;
    let abi;
    try {
      result = await this._scan.getAbi(tokenAddr);
    } catch (error) { 
    }
    if(result.result == 'Contract source code not verified'){
      abi = require('human-standard-token-abi');
    }else{
      abi = JSON.parse(result.result)
    }
    
    let contract = this._contract.contractInstance(abi, tokenAddr);
    let symbol = await this.testSymbol(contract)
    
   
  }
  
  testSymbol(contract){
    let self=contract;
    try {
      return new Promise (function (resolve, reject) {
        self.symbol.call(function(err, res){  
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    } catch (error) {
      console.log(error);
      
      if(this.loadingD != null){
        this.loadingD.close();
        this.loadingD = null;
      }
    }
  }
  */
  async order(form, action, pass, randomExpiration){
    
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const ZERO = new BigNumber(0);
    let netNumber = this._web3.network.chain;
    let net = this._web3.network.urlStarts;
    let error = "";
    let wallet;
    let key;

    try{
      wallet = EthWallet.fromV3(this._account.account.v3, pass);
    }catch(e){
      error= e.message;
    }
    if(error==""){
      key = wallet.getPrivateKeyString()
      
    }
    let substr = key.substring(2, key.length)
    
    this.providerEngine = new Web3ProviderEngine();
    
    this.privateKeyWalletSubprovider =  new PrivateKeyWalletSubprovider(substr);
    this.providerEngine.addProvider(this.privateKeyWalletSubprovider);
    this.subproviders = [new RPCSubprovider('https://'+net+'.infura.io')];
    this.providerEngine.addProvider(new RedundantSubprovider(this.subproviders));
    this.httpClient = new HttpClient(this.providerAddress);
    this.providerEngine.start();

    this.contractWrappers = new ContractWrappers(this.providerEngine, {networkId: netNumber});
    console.log("ContractWrappers",this.contractWrappers);
    this.web3Wrapper = new Web3Wrapper(this.providerEngine);
    let [maker, taker]= await this.web3Wrapper.getAvailableAddressesAsync();
    taker = NULL_ADDRESS;
    this.contractAddresses = getContractAddressesForNetworkOrThrow(netNumber);
    //const randomExpiration = this.getRandomFutureDateInSeconds();
    const exchangeAddress = this.contractAddresses.exchange;
    console.log("exchangeAddress",exchangeAddress);
    

    //const zrxTokenAddress = contractAddresses.zrxToken;
    const etherTokenAddress = this.contractAddresses.etherToken;

    let makerAssetData;
    let makerAssetAmount;
    let takerAssetData;
    let takerAssetAmount;

    if(action == 'buy'){
      console.log("action == buy");
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);

      //let makerDecimals:number = this.token.assetDataB.decimals;
      //let takerDecimals:number = this.token.assetDataA.decimals;
      
      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataB.decimals));
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataA.decimals));

      let x = await this.setUnlimitedProxyAllowance(this.token.assetDataB.tokenAddress, maker);
      console.log("setUnlimitedProxyAllowance",x);
    }

    if(action == 'sell'){
      console.log("action == sell");
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);
      
      //let makerDecimals:number = this.token.assetDataA.decimals.toNumber();
      //let takerDecimals:number = this.token.assetDataB.decimals.toNumber();

      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataA.decimals));
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataB.decimals));

      let x = await this.setUnlimitedProxyAllowance(this.token.assetDataA.tokenAddress, maker);
      console.log("setUnlimitedProxyAllowance",x);
    }
       
    let orderConfigRequest = {
      makerAddress: maker,
      takerAddress: NULL_ADDRESS,
      makerAssetAmount,
      takerAssetAmount,
      makerAssetData,
      takerAssetData,
      exchangeAddress,
      expirationTimeSeconds: randomExpiration,
    }
    console.log("orderConfigRequest",orderConfigRequest);
    
    let orderConfig = await this.getOrderConfig(orderConfigRequest);
    console.log("orderConfig",orderConfig);
    
    const order: Order = {
        salt: generatePseudoRandomSalt(),
        ...orderConfigRequest,
        ...orderConfig,
    };
    console.log("order",order);
    // Generate the order hash and sign it
    const orderHashHex = await orderHashUtils.getOrderHashHex(order);
    console.log("orderHashHex",orderHashHex)
    const signature = await signatureUtils.ecSignHashAsync(this.providerEngine, orderHashHex, maker);
    console.log("signature",signature);

    const signedOrder : SignedOrder = {
      ...order, 
      signature 
    };
    try {
      await this.contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
      await this.httpClient.submitOrderAsync(signedOrder, { networkId: this._web3.network.chain});
      
    } catch (error) {
      this.order(form, action, pass, randomExpiration)
    }
    this.orderbook = [];
    this.getOrderbook(makerAssetData, takerAssetData, 1)  
   
  }

  async getOrderbook(makerAssetData, takerAssetData, pageNumber){
    const orderbookRequest: OrderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
    const response = await this.httpClient.getOrderbookAsync(orderbookRequest, { networkId: this._web3.network.chain, page: pageNumber});
    console.log("OrderBook response?",response);
    if (response.asks.total === 0) {
        throw new Error('No orders found on the SRA Endpoint');
    }else{
      for (let i = 0; i < response.asks.records.length; i++) {
        this.orderbook.push(response.asks.records[i]);
      } 
      if(response.asks.total > response.asks.page * response.asks.perPage){
        await this.getOrderbook(makerAssetData, takerAssetData, pageNumber+1);
      }else{
        console.log("this.orderbook",this.orderbook);
      }
    }
  }

  setProvider(pass?){
    const ZERO = new BigNumber(0);
      let netNumber = this._web3.network.chain;
      let net = this._web3.network.urlStarts;
    if(pass != null){
      let error = "";
      let wallet;
      let key;
  
      try{
        wallet = EthWallet.fromV3(this._account.account.v3, pass);
      }catch(e){
        error= e.message;
      }
      if(error==""){
        key = wallet.getPrivateKeyString()
        
      }
      let substr = key.substring(2, key.length)
      
      this.providerEngine = new Web3ProviderEngine();
      
      this.privateKeyWalletSubprovider =  new PrivateKeyWalletSubprovider(substr);
      this.providerEngine.addProvider(this.privateKeyWalletSubprovider);
      
    }else{
      this.providerEngine = new Web3ProviderEngine();
      console.log("this._web3.web3", this._web3.web3);
      
      this.privateKeyWalletSubprovider =  new RPCSubprovider(this._web3.web3.currentProvider.host);
      this.providerEngine.addProvider(this.privateKeyWalletSubprovider);
      
    }
      this.subproviders = [new RPCSubprovider('https://'+net+'.infura.io')];
      this.providerEngine.addProvider(new RedundantSubprovider(this.subproviders));
      this.httpClient = new HttpClient(this.providerAddress);
      this.providerEngine.start();
  
      this.contractWrappers = new ContractWrappers(this.providerEngine, {networkId: netNumber});
      console.log("ContractWrappers",this.contractWrappers);
      this.contractAddresses = getContractAddressesForNetworkOrThrow(this._web3.network.chain);
      console.log("contractAddresses", this.contractAddresses);
      
      this.setContract();
      this.httpClient = new HttpClient(this.providerAddress);
      this.web3Wrapper = new Web3Wrapper(this.providerEngine);
  }

  async init(){
    await this.setProvider();
    await this.getAssetPairs(1);
    await this.setToken();
    
    if(this.interval != null){
      this.clearBalancesInterval();
    }
    this.startIntervalBalance();
  }

  async startIntervalBalance(){
    await this.getWethBalance();
    this.interval = setInterval(async ()=>{
      await this.getWethBalance();
      await this.updateAllowance();
    },5000);    
  }

  clearBalancesInterval(){
    if(this.interval != null){
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  async getAssetPairs(pageNumber){
    console.log("assetPairs 0x");
    
    const response = await this.httpClient.getAssetPairsAsync({ networkId: this._web3.network.chain, page: pageNumber});
    console.log("response?",response);
    if (response.total === 0) {
        throw new Error('No pairs found on the SRA Endpoint');
    }else{
      console.log("response?",response);
      
      for (let i = 0; i < response.records.length; i++) {
        let decodedA = assetDataUtils.decodeERC20AssetData(response.records[i].assetDataA.assetData);
        let decodedB = assetDataUtils.decodeERC20AssetData(response.records[i].assetDataB.assetData);

        let symbolA = await this.getSymbol(decodedA.tokenAddress);        
        let symbolB = await this.getSymbol(decodedB.tokenAddress);
        let decimalsA = await this.getDecimals(decodedA.tokenAddress);
        let decimalsB = await this.getDecimals(decodedB.tokenAddress);
        let allowanceA = await this.getProxyAllowance(decodedA.tokenAddress, this._account.account.address);
        let allowanceB = await this.getProxyAllowance(decodedB.tokenAddress, this._account.account.address);
        
        let symbolString = symbolA + " - " + symbolB;
        let reverseSymbolString = symbolB + " - " + symbolA;

        let pairA = {
          ...response.records[i].assetDataA,
          ...decodedA,
          decimals: decimalsA,
          name: symbolA,
          allowed: allowanceA
        };
        let pairB = {
          ...response.records[i].assetDataB,
          ...decodedB,
          decimals: decimalsB,
          name: symbolB,
          allowed: allowanceB
        }

        let pairC = {
          assetDataA: pairA,
          assetDataB: pairB,
          reverseName: symbolString,
          name: reverseSymbolString
        }
        
        this.asset_pairs.push(pairC);

      } 
      if(response.total > response.page * response.perPage){
        await this.getAssetPairs(pageNumber+1);
      }else{
        //await this.setToken();
        console.log("this.asset_pairs",this.asset_pairs);
        
        if(this.loadingD != null){
          this.loadingD.close();
        }
      }
    }
  }
  async getSymbol(token){
    let result;
    let abi;
    try {
      result = await this._scan.getAbi(token);
    } catch (error) { 
    }
    if(result.result == 'Contract source code not verified'){
      abi = require('human-standard-token-abi');
    }else{
      abi = JSON.parse(result.result)
    }
    
    let type;
    for (let i = 0; i < abi.length; i++) {
      if(abi[i].name == 'symbol'){
        type = abi[i].outputs[0].type;
      }
      
    }
    
    let contract = this._contract.contractInstance(abi, token);
    
    try {
      let symbol;
      let response = await this._contract.callFunction(contract, 'symbol',[]);
      if(type == "bytes32"){
        let toASCII = this._web3.web3.toAscii(response);
        symbol = '';
        for (var i = 0; i < toASCII.length; i++) {
          if(toASCII.charCodeAt(i) != 0){
            symbol = symbol + toASCII[i];
          }
        }
      }else{
        symbol = response;
      }
      
      return symbol;  
    } catch (error) {
      console.log(error);
      this.getSymbol(token);
    }
  }
  
  async getDecimals(token){
    let result;
    let abi;
    try {
      result = await this._scan.getAbi(token);
    } catch (error) { 
    }
    if(result.result == 'Contract source code not verified'){
      abi = require('human-standard-token-abi');
    }else{
      abi = JSON.parse(result.result)
    }
    let contract = this._contract.contractInstance(abi, token);
    try {
      let decimals = await this._contract.callFunction(contract, 'decimals',[]);
      return decimals;  
    } catch (error) {
      console.log(error);
      this.getDecimals(token)
    }
  }
  
  async depositWETH(amount){
    let value = Web3Wrapper.toBaseUnitAmount(new BigNumber(amount), this.DECIMALS);
    let contractAddr = await this.getContractAddresses();
    let WETHDepositTxHash = await this.contractWrappers.etherToken.depositAsync(
      contractAddr.etherToken,
      value,
      this._account.account.address.toLowerCase(),
    );
    await this.web3Wrapper.awaitTransactionSuccessAsync(WETHDepositTxHash);
    this.init();
  }

  async withdrawWETH(amount){
    let value = Web3Wrapper.toBaseUnitAmount(new BigNumber(amount), this.DECIMALS);
    let contractAddr = await this.getContractAddresses();
    const WETHWithdrawTxHash = await this.contractWrappers.etherToken.withdrawAsync(
      contractAddr.etherToken,
      value,
      this._account.account.address.toLowerCase(),
    );
    await this.web3Wrapper.awaitTransactionSuccessAsync(WETHWithdrawTxHash);
    this.getWethBalance();
  }
  
  async setUnlimitedProxyAllowance(contractAddr, addr){
    console.log("contractAddr", contractAddr);
    console.log("addr", addr);
    
    
    console.log("CONTRACT WRAPPERS????",this.contractWrappers);
    
    let ApprovalTxHash = await this.contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
      contractAddr,
      addr,
    );
    await this.web3Wrapper.awaitTransactionSuccessAsync(ApprovalTxHash);
    return("done")
  }

  async getProxyAllowance(contractAddr, addr){
    let ApprovalTxHash = await this.contractWrappers.erc20Token.getProxyAllowanceAsync(
      contractAddr,
      addr,
    );
    
    return ApprovalTxHash.toNumber()
  }


  async getFeeRecipientsAsync(){
    return await this.httpClient.getFeeRecipientsAsync();
  }
  async getOrder(hash){
    //String hash needed to get order
    return await this.httpClient.getOrderAsync(hash);
  }
  async getOrderConfig(orderConfigRequestObject){
    //OrderConfigRequest object needed to get orderConfig
    return await this.httpClient.getOrderConfigAsync(orderConfigRequestObject);
  }
  async getOrderBook(OrderbookRequestObject){
    //OrderbookRequest object needed to get order book
    return await this.httpClient.getOrderbookAsync(OrderbookRequestObject);
  }
  async getOrders(){
    return await this.httpClient.getOrdersAsync({network: this._web3.network.chain});
  }
  async submitOrder(SignedOrderObject){
    console.log("submitOrder",SignedOrderObject);
    
    //SignedOrder object needed to submit an order
    return await this.httpClient.submitOrderAsync(SignedOrderObject, { networkId: this._web3.network.chain});
  }
  async getAccounts(){
    //const web3Wrapper = new Web3Wrapper(this.providerEngine);
    const blockNumber = await this.web3Wrapper.getBlockNumberAsync();
    const accounts = await this.web3Wrapper.getAvailableAddressesAsync();
    console.log("accounts",accounts);
    console.log("blockNumber?",blockNumber);
  }

  getRandomFutureDateInSeconds = (): BigNumber => {
    const ONE_SECOND_MS = 1000;
    const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
    const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
    return new BigNumber(Date.now() + TEN_MINUTES_MS).div(ONE_SECOND_MS).ceil();
  };
  
  getAbi() {
    return require('../../libs/0x/weth-abi.json');
  }

  setContract() {
    let ADDRESSES = {
      1:"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      3:"0xc778417E063141139Fce010982780140Aa0cD5Ab",
      42:"0xd0A1E359811322d97991E03f863a0C30C2cF029C"
    }
    let address = ADDRESSES[this._web3.network.chain]
    this.contract = this._contract.contractInstance(this.getAbi(), address);
  }
  
  async getWethBalance(){
    let balance = await this.callFunction(this.contract, "balanceOf", [this._account.account.address]);
    this.balance_weth = this._web3.web3.fromWei(balance, 'ether')
    console.log("balanceWeth",this.balance_weth.toNumber());
  }

  async callFunction(contractInst, functionName:string, params){
		return await this._contract.callFunction(contractInst, functionName, params);
	}
  async getContractAddresses(){
    return getContractAddressesForNetworkOrThrow(this._web3.network.chain);
  }

  async setToken(token?) {
    //console.log("setToken funcion 0xService");
    if(token!= null){
      console.log("setTokenFunction 0x Service", token);
      
    }
		//this.showBuys = null;
		//this.showSells = null;
		/*
		if(this.state.orders != null){
			this.state.orders.buys = null;
			this.state.orders.sells = null;
			this.state.orders = null;
    }
    */
		//if(this.activeOrdersInterval != null){
			//await this.clearActiveOrdersInterval();
		//}
		
		if(typeof(token) == "undefined"){
      let localToken = this.getLocalStorageToken();
			if(localToken !=null && (this.asset_pairs.find(token=>token.assetDataA.tokenAddress == localToken.assetDataA.tokenAddress && token.assetDataB.tokenAddress == localToken.assetDataB.tokenAddress) != null)) {
        this.token = localToken;
        this.updateAllowance();
			} else {
				this.token = this.asset_pairs[1]; 
			}
		}else{
			this.token = token
		}
		console.log("this.token", this.token);
    
		this.saveLocalStorageToken();
		//this.setTokenContract();
		//this.getTokenState();
		this.resetTokenBalances();
    this.setBalances();
    if(this.loadingD != null){
      this.loadingD.close();
    }

    
  }
  getLocalStorageToken(){
		if(localStorage.getItem('0xToken')){
			return JSON.parse(localStorage.getItem('0xToken'));
		}else{
			return null;
    }
  }
  
  saveLocalStorageToken(){
		if(this.token != null){
			localStorage.removeItem('0xToken');
			localStorage.setItem('0xToken', JSON.stringify(this.token));
			
		}else{
			localStorage.removeItem('0xToken');	
		}
		let contenido = JSON.parse(localStorage.getItem('0xToken'));
		
  }

  /*
  setTokenContract() {
    let abi = require('human-standard-token-abi');
    //let contract = this._contract.contractInstance(abi, token);
    this.contractToken = this._web3.web3.eth.contract(abi);
		this.token.contract = this.contractToken.at(this.token.addr)
  }
  */
  resetTokenBalances() {
		this.token.assetDataA.balance = null;
    this.token.assetDataB.balance = null;
  }
  
  async setBalances() {
		this.token.assetDataA.balance = await this.getBalance(this.token.assetDataA);
    this.token.assetDataB.balance = await this.getBalance(this.token.assetDataB);
    console.log("log this tokens inside setBalances",this.token);
    console.log("balance A", this.token.assetDataA.balance, this.token.assetDataA.name);
    console.log("balance B", this.token.assetDataB.balance, this.token.assetDataB.name);
    
    /*
		if(this.token.name =="ETH"){
			this.marketBalances.token = await this.getMarketEther();
		}else{
			this.marketBalances.token = await this.getMarketBalance();
		}		
    this.marketBalances.eth = await this.getMarketEther();
    */

  }

  async updateAllowance(){
    this.token.assetDataA.allowed = await this.getProxyAllowance(this.token.assetDataA.tokenAddress, this._account.account.address);;
    this.token.assetDataB.allowed = await this.getProxyAllowance(this.token.assetDataB.tokenAddress, this._account.account.address);;
  }

  async getBalance(token) {
    let balance:number = 0;
    let result;
    let abi;
    try {
      result = await this._scan.getAbi(token.tokenAddress);
    } catch (error) { 
    }
    if(result.result == 'Contract source code not verified'){
      abi = require('human-standard-token-abi');
    }else{
      abi = JSON.parse(result.result)
    }
    
    let contract = this._contract.contractInstance(abi, token.tokenAddress);
    
			if(contract != null){
				let value;
				try {
          value = await this._contract.callFunction(contract, 'balanceOf', [this._account.account.address]);
          console.log("try value",value.toNumber());
          
				} catch (error) {
					console.log(error);
					this.getBalance(token);
				}
				
        let x = value.toString();
        
        let resBig = new BigNumber(x);
        let y;
        if(token.decimals != null){
          y = resBig.div(Math.pow(10,token.decimals));
        }else{
          y = resBig.div(Math.pow(10,18));
        }
				
        balance = y.toNumber();
        
			}
		
		return balance;
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