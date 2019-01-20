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

  public orderbook;
  public asks=[];
  public bids = [];
  public selectedPair = [];
  public asset_pairs = [];
  public contractToken;
  public token: any;
  public state:any={
		orders : undefined,
		myOrders: undefined,
		myTrades: undefined,
		myFunds: undefined	
  };
  showBuys;
  showSells;
  constructor(private http: Http, public _account: AccountService, private _wallet : WalletService, protected dialog: MdDialog, private _token : TokenService, private _web3: Web3, private router: Router, private _scan: EtherscanService, private _contract: ContractService){
    
    this.init();
    
  }
  
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

    console.log("this.providerEngine",this.providerEngine);
    
    this.contractWrappers = new ContractWrappers(this.providerEngine, {networkId: netNumber});
    console.log("ContractWrappers",this.contractWrappers);
    this.web3Wrapper = new Web3Wrapper(this.providerEngine);
    let [maker, taker]= await this.web3Wrapper.getAvailableAddressesAsync();
    console.log("maker", maker);
    
    taker = NULL_ADDRESS;
    this.contractAddresses = getContractAddressesForNetworkOrThrow(netNumber);
    
    const exchangeAddress = this.contractAddresses.exchange;
    console.log("exchangeAddress",exchangeAddress);
    
    const etherTokenAddress = this.contractAddresses.etherToken;

    let makerAssetData;
    let makerAssetAmount;
    let takerAssetData;
    let takerAssetAmount;

    if(action == 'buy'){
      console.log("action == buy");
      //want to buy ZRX for WETH
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);

      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataB.decimals));
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataA.decimals));
      console.log("makerAmount", makerAssetAmount.toNumber());
      console.log("takerAmount", takerAssetAmount.toNumber());
      console.log("price?", makerAssetAmount.div(takerAssetAmount).toNumber());
      
      
      
      
      let x = await this.setUnlimitedProxyAllowance(this.token.assetDataB.tokenAddress, maker);
      console.log("setUnlimitedProxyAllowance",x);
    }

    if(action == 'sell'){
      console.log("action == sell");
      //want to buy WETH for ZRX
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);

      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataA.decimals));
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataB.decimals));

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
    console.log("signedOrder",signedOrder);
    

    try {
      await this.contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
      console.log("validateOrder OK!");
      
      
    } catch (error) {
      console.log("validateOrderFillable error",error); 
      //this.order(form, action, pass, randomExpiration)
    }

    try {
      await this.httpClient.submitOrderAsync(signedOrder, { networkId: this._web3.network.chain});
      console.log("submit OK!");
      
    } catch (error) {
      console.log("submitOrder error",error);
    }

    this.orderbook = null;
    this.asks=[];
    this.bids=[];
    this.getOrderbook(makerAssetData, takerAssetData, 1);
   
  }
  

  async getOrderbook(makerAssetData, takerAssetData, pageNumber){
    const orderbookRequest: OrderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
    const response = await this.httpClient.getOrderbookAsync(orderbookRequest, { networkId: this._web3.network.chain, page: pageNumber});
    console.log("ORDERBOOK RESPONSE?",response);
    let decodedMakerDataAsks;
    let decodedMakerDataBids;
    let decodedTakerDataAsks;
    let decodedTakerDataBids
    if (response.asks.total === 0){
        console.log("ZEROEX THIS ASKS",this.asks);
        
        this.orderbook = {
          asks: this.asks
        }
    }else{
      decodedMakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[0].order.makerAssetData);
      decodedTakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[0].order.takerAssetData);
      let makerSymbolAsks = await this.getSymbol(decodedMakerDataAsks.tokenAddress);        
      let takerSymbolAsks = await this.getSymbol(decodedTakerDataAsks.tokenAddress);
      let takerDecimals = await this.getDecimals(decodedTakerDataAsks.tokenAddress);
      console.log("TAKER DECIMALS", takerDecimals.toString());

      for (let i = 0; i < response.asks.records.length; i++) {
        let decodedMakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[i].order.makerAssetData);
        let decodedTakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[i].order.takerAssetData);

        let orderPrice = response.asks.records[i].order.takerAssetAmount.div(response.asks.records[i].order.makerAssetAmount).toNumber();
        let takerAmount = response.asks.records[i].order.takerAssetAmount.toNumber();
        let makerAmount = response.asks.records[i].order.makerAssetAmount.toNumber();
        let remainingAmount = parseInt(response.asks.records[i].metaData.takerAssetAmountRemaining);
        let availableAmount = takerAmount - remainingAmount;

        let x = takerDecimals.toString();
        let exp = 10 ** parseInt(x)
        let readableTakerAmount = takerAmount / exp;
        
        console.log("takerAmount", takerAmount);
        console.log("takerAmount div exp decimals", readableTakerAmount ) ;
        

        let decodedMakerData = {
          ...decodedMakerDataAsks,
          symbol: makerSymbolAsks
        }
        let decodedTakerData = {
          ...decodedTakerDataAsks,
          symbol: takerSymbolAsks
        }
        let obj = {
          orderResponse: response.asks.records[i],
          decodedMakerData: decodedMakerData,
          decodedTakerData: decodedTakerData,
          price: orderPrice,
          takerAmount: takerAmount,
          makerAmount: makerAmount,
          filledAmount: availableAmount,
          expirationTimeSeconds: response.asks.records[i].order.expirationTimeSeconds.toNumber(),
          readableTakerAmount: readableTakerAmount
        }
        this.asks.push(obj);
      }
    }
    if(response.bids.total === 0){
      console.log("ZEROEX THIS BIDS",this.bids);
      
      this.orderbook = {
        bids: this.bids
      }
    }else{
      decodedMakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[0].order.makerAssetData);
      decodedTakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[0].order.takerAssetData);
      let makerSymbolBids = await this.getSymbol(decodedMakerDataBids.tokenAddress);        
      let takerSymbolBids = await this.getSymbol(decodedTakerDataBids.tokenAddress);
      let takerDecimals = await this.getDecimals(decodedTakerDataBids.tokenAddress);
      
      for (let i = 0; i < response.bids.records.length; i++) {
        let decodedMakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[i].order.makerAssetData);
        let decodedTakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[i].order.takerAssetData);

        let orderPrice = response.bids.records[i].order.makerAssetAmount.div(response.bids.records[i].order.takerAssetAmount).toNumber();
        let takerAmount = response.bids.records[i].order.takerAssetAmount.toNumber();
        let makerAmount = response.bids.records[i].order.makerAssetAmount.toNumber();
        let remainingAmount = parseInt(response.bids.records[i].metaData.takerAssetAmountRemaining);
        let availableAmount = takerAmount - remainingAmount;
        
        let x = takerDecimals.toString();
        let exp = 10 ** parseInt(x)
        let readableTakerAmount = takerAmount / exp;
        
        console.log("takerAmount", takerAmount);
        console.log("takerAmount div exp decimals", readableTakerAmount ) ;
        
        
        let decodedMakerData = {
          ...decodedMakerDataBids,
          symbol: makerSymbolBids
        }
        let decodedTakerData = {
          ...decodedTakerDataBids,
          symbol: takerSymbolBids
        }
        let obj = {
          orderResponse: response.bids.records[i],
          decodedMakerData: decodedMakerData,
          decodedTakerData: decodedTakerData,
          price: orderPrice,
          takerAmount: takerAmount,
          makerAmount: makerAmount,
          filledAmount: availableAmount,
          expirationTimeSeconds: response.bids.records[i].order.expirationTimeSeconds.toNumber(),
          readableTakerAmount: readableTakerAmount
        }
        this.bids.push(obj);
      }
    }
      if(response.asks.total != 0 && response.bids.total != 0){
        if(response.asks.total > (response.asks.page * response.asks.perPage) || response.bids.total > (response.bids.page * response.bids.perPage)){
          await this.getOrderbook(makerAssetData, takerAssetData, pageNumber+1);
        }else{
          this.orderbook = {
            asks: this.asks,
            bids: this.bids
          }
          this.state.orders = {buys:[], sells:[]};
          console.log("this.orderbook",this.orderbook);
          
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataB.tokenAddress && decodedMakerDataBids.tokenAddress == this.token.assetDataA.tokenAddress){
            if(this.loadingD != null){
              this.loadingD.close();
            }
            this.getBuys(this.orderbook.asks);
            this.getSells(this.orderbook.bids);
            this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
            
          }
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataA.tokenAddress && decodedMakerDataBids.tokenAddress == this.token.assetDataB.tokenAddress){
            if(this.loadingD != null){
              this.loadingD.close();
            }
            this.getBuys(this.orderbook.bids);
            this.getSells(this.orderbook.asks);
            this.setShowOrders(this.orderbook.bids, this.orderbook.asks);
            
          }
          
        }
      }else{
        this.orderbook = {
          asks: this.asks,
          bids: this.bids
        }
        if(this.loadingD != null){
          this.loadingD.close();
        }
        this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
        
        
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
      console.log("wallet", wallet);
      
      if(error==""){
        key = wallet.getPrivateKeyString()
        
      }
      console.log("key",key);
      
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
    this.activateLoading();
    await this.setProvider();
    await this.getAssetPairs(1);
    
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

    if (response.total === 0) {
        //throw new Error('No pairs found on the SRA Endpoint');
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
        this.setToken();
        console.log("this.asset_pairs",this.asset_pairs);
        
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
    this.setBalances();
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
    this.setBalances();
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
    console.log("VALUE THIS LOADINGD", this.loadingD);
    
    if(this.loadingD == null){
      this.activateLoading();
    }
    console.log("SET TOKEN FUNCTION??????!?!?!?");
    
    if(token!= null){
      console.log("setTokenFunction 0x Service", token);
      
    }
		this.showBuys = null;
		this.showSells = null;
		console.log("THIS STATE ORDERS???????", this.state.orders);
    
		if(this.state.orders != null){
      console.log("if this state orders != null");
      
			this.state.orders.buys = null;
			this.state.orders.sells = null;
      this.state.orders = null;
      this.orderbook = null;
      this.asks=[];
      this.bids=[];
    }
    
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
			this.token = token;
		}
		console.log("this.token", this.token);
    
		this.saveLocalStorageToken();
		//this.setTokenContract();
		//this.getTokenState();
		this.resetTokenBalances();
    this.setBalances();
    
    this.getOrderbook(this.token.assetDataA.assetData, this.token.assetDataB.assetData, 1);
    
  }

  getBuys(orders){
    console.log("getBuys function");
    
    this.state.orders.buys = orders;
    console.log("THIS.STATE.ORDERS.BUYS",this.state.orders.buys);
    
  }

  getSells(orders){
    console.log("getSells function");
    console.log("orders", orders);
    this.state.orders.sells = orders;
    console.log("THIS.STATE.ORDERS.SELLS",this.state.orders.sells);
  }
  async setShowOrders(buys, sells){
    console.log("BUYS ZEROEX",buys);
    console.log("SELLS ZEROEX", sells);
    
    
		this.showBuys = buys;
		this.showSells = sells;
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
		let contenido = JSON.parse(localStorage.getItem('0xToken')); //don't do nothing
		
  }

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