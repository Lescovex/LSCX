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
import { assetDataUtils, BigNumber, ContractWrappers, generatePseudoRandomSalt, Order, orderHashUtils, signatureUtils, AssetProxyId} from '0x.js';
import { RedundantSubprovider, RPCSubprovider, SignerSubprovider, Web3ProviderEngine, PrivateKeyWalletSubprovider } from '@0x/subproviders';
import { HttpClient, OrderbookRequest, OrderConfigRequest, OrderbookResponse, SignedOrder } from '@0x/connect';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses/lib/src';

import * as Web3L from 'web3';
import * as EthWallet from 'ethereumjs-wallet';

@Injectable()
export class ZeroExService{
  protected providerEngine;
  protected providerAddress = "https://sra.bamboorelay.com/0x/v2/";
  protected webSocketProviderAddress = "wss://sra.bamboorelay.com/0x/v2/ws";
  //protected providerAddress = "https://api.openrelay.xyz/v2/";
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
  public interval2;

  public loadingD;

  public orderbook;
  public asks=[];
  public bids = [];
  public selectedPair = [];
  public asset_pairs = [];
  public asset_pairs_mem = [];
  public contractToken;
  public token: any;
  public state:any={
		orders : undefined,
		myOrders: undefined,
		myTrades: undefined,
		myFunds: undefined	
  };
  public showBuys;
  public showSells;

  public NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
  public ZERO = new BigNumber(0);

  protected abiBytes = require("../../libs/0x/x.json");

  constructor(private http: Http, public _account: AccountService, private _wallet : WalletService, protected dialog: MdDialog, private _token : TokenService, private _web3: Web3, private router: Router, private _scan: EtherscanService, private _contract: ContractService){
    this.init();    
  }
  
  async order(form, action, pass, randomExpiration){
    await this.setProvider(pass);
    let [maker, taker]= await this.web3Wrapper.getAvailableAddressesAsync();
    console.log("maker", maker);
    
    taker = this.NULL_ADDRESS;
    let exchangeAddress = this.contractAddresses.exchange;
    
    let makerAssetData;
    let makerAssetAmount;
    let takerAssetData;
    let takerAssetAmount;
    
    let makerTokenAddress;
    if(action == 'buy'){
      console.log("action == buy");
      //sell weth to buy ZRX
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);

      makerTokenAddress = this.token.assetDataB.tokenAddress;

      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataB.decimals));//give weth
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataA.decimals));//get zrx
      //let x = await this.setUnlimitedProxyAllowance(this.token.assetDataB.tokenAddress, maker);
      //console.log("setUnlimitedProxyAllowance",x);
      let ApprovalTxHash = await this.contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
        this.token.assetDataB.tokenAddress,
        maker,
      );
      await this.web3Wrapper.awaitTransactionSuccessAsync(ApprovalTxHash);
    }

    if(action == 'sell'){
      console.log("action == sell");
      //sell zrx to buy weth
      makerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataA.tokenAddress);
      takerAssetData = assetDataUtils.encodeERC20AssetData(this.token.assetDataB.tokenAddress);

      makerTokenAddress = this.token.assetDataA.tokenAddress;

      makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.amount.value), parseInt(this.token.assetDataA.decimals));//give zrx
      takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(form.total.value), parseInt(this.token.assetDataB.decimals));//get weth
      //let x = await this.setUnlimitedProxyAllowance(this.token.assetDataA.tokenAddress, maker);
      //console.log("setUnlimitedProxyAllowance",x);
      let ApprovalTxHash = await this.contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
        this.token.assetDataA.tokenAddress,
        maker,
      );
      await this.web3Wrapper.awaitTransactionSuccessAsync(ApprovalTxHash);
    }
    
    let x = "18";
    let exp = 10 ** parseInt(x)
    let redeableMakerAssetAmount:any = makerAssetAmount.div(exp).toNumber();
    let redeableTakerAssetAmount:any = takerAssetAmount.div(exp).toNumber();
    console.log("REDEABLE MakerAssetAmount", redeableMakerAssetAmount);
    console.log("REDEABLE TakerAssetAmount", redeableTakerAssetAmount);
   
    console.log("EXPIRATION BEFORE",randomExpiration.toNumber());
    var duration:any = 60*60*24;
    randomExpiration = this.getRandomFutureDateInSeconds();
    
    let orderConfigRequest = {
      makerAddress: maker,
      takerAddress: taker,
      makerAssetAmount,
      takerAssetAmount,
      makerAssetData,
      takerAssetData,
      exchangeAddress,
      expirationTimeSeconds: randomExpiration ,
    }
    console.log("EXPIRATION AFTER", randomExpiration.toNumber());
    console.log("orderConfigRequest",orderConfigRequest);
    
    let orderConfig = await this.getOrderConfig(orderConfigRequest);
    console.log("orderConfig",orderConfig);
    
    let order: Order = {
        salt: generatePseudoRandomSalt(),
        ...orderConfigRequest,
        ...orderConfig,
    };
    
    console.log("order",order);
    
    console.log(order.makerFee.toNumber());
    let redeableMakerFee:any = makerAssetAmount.div(exp).toNumber();
    console.log("REDEABLE MAKER FEE", redeableMakerFee );
    
    let orderHashHex = await orderHashUtils.getOrderHashHex(order);
    console.log("orderHashHex",orderHashHex)
    let signature = await signatureUtils.ecSignHashAsync(this.providerEngine, orderHashHex, maker);
    console.log("signature",signature);

    let signedOrder : SignedOrder = {
      ...order, 
      signature
    };
    console.log("signedOrder",signedOrder);
    

    try {
      await this.contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
      console.log("validateOrder OK!");
      
    } catch (error) {
      console.log("validateOrderFillable error",error); 
      //openErrorDialog
      return false;
    }

    try {
      await this.httpClient.submitOrderAsync(signedOrder, { networkId: this._web3.network.chain});
      console.log("submit OK!");
      
    } catch (error) {
      console.log("submitOrder error",error);
      //openErrorDialog
      return false;
    }

    await this.getOrderbook(this.token.assetDataA.assetData, this.token.assetDataB.assetData, 1);
  }
  
  async fillOrder(order, value, taker, action, key){
    await this.setProvider(key)
    
    //setUnlimitedAllowance
    let x = await this.setUnlimitedProxyAllowance(order.decodedTakerData.tokenAddress, taker);
    console.log(x);
    
    let TX_DEFAULTS = { gas: 400000 };
    let decimals;
    if(order.decodedTakerData.tokenAddress == this.token.assetDataA.tokenAddress){
      decimals = this.token.assetDataA.decimals;
    }
    if(order.decodedTakerData.tokenAddress == this.token.assetDataB.tokenAddress){
      decimals = this.token.assetDataB.decimals;
    }
    let takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(value), parseInt(decimals));
    try {
      await this.contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(order.orderResponse.order, takerAssetAmount, taker);  
    } catch (error) {
      throw new Error(error);
      //console.log("error of validateFillOrder", error); 
    }
    let txHash = await this.contractWrappers.exchange.fillOrderAsync(order.orderResponse.order, takerAssetAmount, taker, {
        gasLimit: TX_DEFAULTS.gas,
    });
    await this.web3Wrapper.awaitTransactionSuccessAsync(txHash);
    await this.setBalances();
    await this.getOrderbook(this.token.assetDataA.assetData, this.token.assetDataB.assetData, 1);
  }

  async getOrderbook(makerAssetData, takerAssetData, pageNumber){    
    this.orderbook = null;
    this.asks=[];
    this.bids=[];

    let orderbookRequest: OrderbookRequest = { baseAssetData: makerAssetData, quoteAssetData: takerAssetData };
    let response = await this.httpClient.getOrderbookAsync(orderbookRequest, { networkId: this._web3.network.chain, page: pageNumber});
    console.log("ORDERBOOK RESPONSE?",response);
    let decodedMakerDataAsks:any;
    let decodedMakerDataBids:any;
    let decodedTakerDataAsks:any;
    let decodedTakerDataBids:any;
    let makerSymbol:any;
    let takerSymbol:any;
    let takerDecimals:any;

    if (response.asks.total === 0){
        this.orderbook = {
          asks: this.asks
        }
    }else{
      
      decodedMakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[0].order.makerAssetData);
      decodedTakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[0].order.takerAssetData);
      
      if(decodedMakerDataAsks.tokenAddress == this.token.assetDataA.tokenAddress && decodedTakerDataAsks.tokenAddress == this.token.assetDataB.tokenAddress){
        makerSymbol = this.token.assetDataA.name;
        takerSymbol = this.token.assetDataB.name;
        takerDecimals = this.token.assetDataB.decimals;
      }
      if(decodedMakerDataAsks.tokenAddress == this.token.assetDataB.tokenAddress && decodedTakerDataAsks.tokenAddress == this.token.assetDataA.tokenAddress){
        makerSymbol = this.token.assetDataB.name;
        takerSymbol = this.token.assetDataA.name;
        takerDecimals = this.token.assetDataA.decimals
      }

      for (let i = 0; i < response.asks.records.length; i++) {
        decodedMakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[i].order.makerAssetData);
        decodedTakerDataAsks = assetDataUtils.decodeERC20AssetData(response.asks.records[i].order.takerAssetData);

        let orderPrice = response.asks.records[i].order.takerAssetAmount.div(response.asks.records[i].order.makerAssetAmount).toNumber();
        let takerAmount = response.asks.records[i].order.takerAssetAmount.toNumber();
        let makerAmount = response.asks.records[i].order.makerAssetAmount.toNumber();
        let remainingAmount = parseInt(response.asks.records[i].metaData.remainingTakerAssetAmount);
                                                                        
        let availableAmount = takerAmount - remainingAmount;
        console.log("availableAmount asks",availableAmount);
        let x = takerDecimals.toString();
        let exp = 10 ** parseInt(x)
        let readableTakerAmount = takerAmount / exp;
        let filledAmount = availableAmount / exp;

        let takerAssetAmountRemaining = response.asks.records[i].metaData.remainingTakerAssetAmount / exp;
        console.log("takerAssetAmountRemaining",takerAssetAmountRemaining);
        console.log("takerAssetAmountRemaining before parse",response.asks.records[i].metaData.remainingTakerAssetAmount);
        
        //console.log("takerAmount", takerAmount);
        //console.log("takerAmount div exp decimals", readableTakerAmount ) ;
        

        let makerData = {
          ...decodedMakerDataAsks,
          symbol: makerSymbol
        }
        let takerData = {
          ...decodedTakerDataAsks,
          symbol: takerSymbol
        }
        let obj = {
          orderResponse: response.asks.records[i],
          decodedMakerData: makerData,
          decodedTakerData: takerData,
          price: orderPrice,
          makerAmount: makerAmount,
          filledAmount: filledAmount,
          expirationTimeSeconds: response.asks.records[i].order.expirationTimeSeconds.toNumber(),
          takerAmount: readableTakerAmount,
          amountRemaining: takerAssetAmountRemaining
        }
        this.asks.push(obj);
      }
    }
    if(response.bids.total === 0){
      this.orderbook = {
        bids: this.bids
      }
    }else{
      decodedMakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[0].order.makerAssetData);
      decodedTakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[0].order.takerAssetData);
      if(decodedMakerDataBids.tokenAddress == this.token.assetDataA.tokenAddress && decodedTakerDataBids.tokenAddress == this.token.assetDataB.tokenAddress){
        makerSymbol = this.token.assetDataA.name;
        takerSymbol = this.token.assetDataB.name;
        takerDecimals = this.token.assetDataB.decimals;
      }
      if(decodedMakerDataBids.tokenAddress == this.token.assetDataB.tokenAddress && decodedTakerDataBids.tokenAddress == this.token.assetDataA.tokenAddress){
        makerSymbol = this.token.assetDataB.name;
        takerSymbol = this.token.assetDataA.name;
        takerDecimals = this.token.assetDataA.decimals
      }
      
      for (let i = 0; i < response.bids.records.length; i++) {
        decodedMakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[i].order.makerAssetData);
        decodedTakerDataBids = assetDataUtils.decodeERC20AssetData(response.bids.records[i].order.takerAssetData);

        let orderPrice = response.bids.records[i].order.makerAssetAmount.div(response.bids.records[i].order.takerAssetAmount).toNumber();
        let takerAmount = response.bids.records[i].order.takerAssetAmount.toNumber();
        let makerAmount = response.bids.records[i].order.makerAssetAmount.toNumber();
        let remainingAmount = parseInt(response.bids.records[i].metaData.remainingTakerAssetAmount);
        let availableAmount = takerAmount - remainingAmount;
        console.log("availableAmount bids",availableAmount);
        
        let x = takerDecimals.toString();
        let exp = 10 ** parseInt(x)
        let readableTakerAmount = takerAmount / exp;
        let filledAmount = availableAmount / exp;
        //console.log("takerAssetAmountRemaining",response.bids.records[i].metaData.takerAssetAmountRemaining);
        let takerAssetAmountRemaining = response.bids.records[i].metaData.remainingTakerAssetAmount / exp;
        console.log("takerAssetAmountRemaining",takerAssetAmountRemaining);
        console.log("takerAssetAmountRemaining before parse",response.bids.records[i].metaData.remainingTakerAssetAmount);
        
        //console.log("takerAmount", takerAmount);
        //console.log("takerAmount div exp decimals", readableTakerAmount ) ;
        
        
        let makerData = {
          ...decodedMakerDataBids,
          symbol: makerSymbol
        }
        let takerData = {
          ...decodedTakerDataBids,
          symbol: takerSymbol
        }
        let obj = {
          orderResponse: response.bids.records[i],
          decodedMakerData: makerData,
          decodedTakerData: takerData,
          price: orderPrice,
          makerAmount: makerAmount,
          filledAmount: filledAmount,
          expirationTimeSeconds: response.bids.records[i].order.expirationTimeSeconds.toNumber(),
          takerAmount: readableTakerAmount,
          amountRemaining: takerAssetAmountRemaining
        }
        this.bids.push(obj);
      }
    }

    if(response.asks.total === 0 && response.bids.total === 0){
      //If null in both parts
      this.orderbook = {
        asks: this.asks,
        bids: this.bids
      }
      this.state.orders = {buys:[], sells:[]};
      console.log("SI ASKS Y BIDS NULL ORDERBOOK",this.orderbook);

      if(this.loadingD != null){
        this.loadingD.close();
        this.loadingD = null;
      }
      this.setBuys(this.orderbook.asks);
      this.setSells(this.orderbook.bids);
      this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
    }else{
      //checks if needs other call
      if(response.asks.total > (response.asks.page * response.asks.perPage) || response.bids.total > (response.bids.page * response.bids.perPage)){
        await this.getOrderbook(makerAssetData, takerAssetData, pageNumber+1);
      }else{
        //if don't needs do more calls
        //it must assign data correctly
        this.orderbook = {
          asks: this.asks,
          bids: this.bids
        }
        this.state.orders = {buys:[], sells:[]};

        //if not null decodedDataAsks and decodedDataBids
        if(decodedMakerDataAsks != null && decodedMakerDataBids != null){
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataB.tokenAddress && decodedMakerDataBids.tokenAddress == this.token.assetDataA.tokenAddress){
            this.setBuys(this.orderbook.asks);
            this.setSells(this.orderbook.bids);
            this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
          }
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataA.tokenAddress && decodedMakerDataBids.tokenAddress == this.token.assetDataB.tokenAddress){
            this.setBuys(this.orderbook.bids);
            this.setSells(this.orderbook.asks);
            this.setShowOrders(this.orderbook.bids, this.orderbook.asks); 
          }  
        }
        //if decodedDataAsks == null && decodedDataBids != null
        if(decodedMakerDataAsks == null && decodedMakerDataBids != null){
          if(decodedMakerDataBids.tokenAddress == this.token.assetDataA.tokenAddress){
            this.setBuys(this.orderbook.asks);
            this.setSells(this.orderbook.bids);
            this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
          }
          if(decodedMakerDataBids.tokenAddress == this.token.assetDataB.tokenAddress){
            this.setBuys(this.orderbook.bids);
            this.setSells(this.orderbook.asks);
            this.setShowOrders(this.orderbook.bids, this.orderbook.asks);
          }
        }
        //if decodedDataBids == nul && decodedDataAsks != null;
        if(decodedMakerDataAsks != null && decodedMakerDataBids == null){
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataB.tokenAddress){
            this.setBuys(this.orderbook.asks);
            this.setSells(this.orderbook.bids);
            this.setShowOrders(this.orderbook.asks, this.orderbook.bids);
          }
          if(decodedMakerDataAsks.tokenAddress == this.token.assetDataA.tokenAddress){
            this.setBuys(this.orderbook.bids);
            this.setSells(this.orderbook.asks);
            this.setShowOrders(this.orderbook.bids, this.orderbook.asks); 
          }
        }
        //closing loading dialog
        if(this.loadingD != null){
          this.loadingD.close();
          this.loadingD = null;
        }
      }
    } 
  }

  setProvider(pass?){
      let ZERO = new BigNumber(0);
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
    
  }

  async startIntervalBalance(){
    await this.getWethBalance();
    this.interval = setInterval(async ()=>{
      await this.getWethBalance();
      await this.setBalances();
      await this.updateAllowance();
    },5000);
  }
  async startIntervalPairs(){
    
    this.interval2 = setInterval(async ()=>{
      //await this.getAssetPairs(1);
    },10000);
  }

  clearBalancesInterval(){
    if(this.interval != null){
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  async getAssetPairs(pageNumber){
    
    let response = await this.httpClient.getAssetPairsAsync({ networkId: this._web3.network.chain, page: pageNumber});
    console.log("assetPairs 0x", response);
    if (response.total === 0) {
      this.asset_pairs == response.response;

      this.loadingD.close();
        //throw new Error('No pairs found on the SRA Endpoint');
    }else{
      for (let i = 0; i < response.records.length; i++) {
        console.log("response.records[i]",response.records[i]);
        
        let decodedA;
        let decodedB;
        try {
          decodedA = assetDataUtils.decodeERC20AssetData(response.records[i].assetDataA.assetData);
          
        } catch (error) {
          console.log("DECODE A ERROR", error);
          
        }
        try {
          decodedB = assetDataUtils.decodeERC20AssetData(response.records[i].assetDataB.assetData);
          
        } catch (error) {
          console.log("DECODE B ERROR", error);
        }
        
        let symbolA = await this.getSymbol(decodedA.tokenAddress);
        let symbolB = await this.getSymbol(decodedB.tokenAddress);
        console.log("symbol",symbolA, symbolB);
        
        let symbolString = symbolA + " - " + symbolB;
        let reverseSymbolString = symbolB + " - " + symbolA;

        let pairA = {
          ...response.records[i].assetDataA,
          ...decodedA,
          decimals: null,
          name: symbolA,
          allowed: null
        };
        let pairB = {
          ...response.records[i].assetDataB,
          ...decodedB,
          decimals: null,
          name: symbolB,
          allowed: null
        }

        let pairC = {
          assetDataA: pairA,
          assetDataB: pairB,
          reverseName: symbolString,
          name: reverseSymbolString
        }
        
        this.asset_pairs_mem.push(pairC);
      } 
      if(response.total > response.page * response.perPage){
        await this.getAssetPairs(pageNumber+1);
      } else {
        this.asset_pairs = this.asset_pairs_mem;
        this.asset_pairs_mem = [];
        if(this.interval != null){
          this.clearBalancesInterval();
        }
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
      let contract = this._contract.contractInstance(this.abiBytes, token);
      let symbol; 
      let type;
      for (let i = 0; i < this.abiBytes.length; i++) {
        if(this.abiBytes[i].name == 'symbol'){
          type = this.abiBytes[i].outputs[0].type;
        }
      }
      try {
        let response = await this._contract.callFunction(contract, 'symbol', []);
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
        console.log("GET SYMBOL ERROR OF ERRROR!!!!!!!!!!!",error);
        this.getSymbol(token)
      }
    }
  }
  
  async getDecimals(token){
    let result;
    let abi;
    try {
      result = await this._scan.getAbi(token);
    } catch (error) {
      console.log(error);
      
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
      return 18;
      //this.getDecimals(token);
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
    let WETHWithdrawTxHash = await this.contractWrappers.etherToken.withdrawAsync(
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
    //let web3Wrapper = new Web3Wrapper(this.providerEngine);
    let blockNumber = await this.web3Wrapper.getBlockNumberAsync();
    let accounts = await this.web3Wrapper.getAvailableAddressesAsync();
    console.log("accounts",accounts);
    console.log("blockNumber?",blockNumber);
  }

  getRandomFutureDateInSeconds = (): BigNumber => {
    let ONE_SECOND_MS = 1000;
    let ONE_MINUTE_MS = ONE_SECOND_MS * 60;
    let TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
    let ONE_HOUR_MS = ONE_MINUTE_MS * 60;
    let ONE_DAY_MS = ONE_HOUR_MS * 24;
    return new BigNumber(Date.now() + ONE_DAY_MS).div(ONE_SECOND_MS).ceil();
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
    //console.log("balanceWeth",this.balance_weth.toNumber());
  }

  async callFunction(contractInst, functionName:string, params){
		return await this._contract.callFunction(contractInst, functionName, params);
	}
  async getContractAddresses(){
    return getContractAddressesForNetworkOrThrow(this._web3.network.chain);
  }

  async setToken(token?) {
    if(this.loadingD == null){
      this.activateLoading();
    }
    console.log("SET TOKEN FUNCTION??????!?!?!?");
    
    if(token!= null){
      console.log("setTokenFunction 0x Service", token);
      
    }
		//this.showBuys = null;
		//this.showSells = null;
		
		if(this.state.orders != null){
			this.state.orders.buys = null;
			this.state.orders.sells = null;
      this.state.orders = null;
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
    //after set token we need to get allowance and get decimals
    this.token.assetDataA.decimals = await this.getDecimals(this.token.assetDataA.tokenAddress);
    this.token.assetDataB.decimals = await this.getDecimals(this.token.assetDataB.tokenAddress);
    
    
    try {
      this.token.assetDataA.allowed = await this.getProxyAllowance(this.token.assetDataA.tokenAddress, this._account.account.address);
      
    } catch (error) {
      this.token.assetDataA.allowed = 0;
    }

    try {  
      this.token.assetDataB.allowed = await this.getProxyAllowance(this.token.assetDataB.tokenAddress, this._account.account.address);
    
    } catch (error) {
      this.token.assetDataB.allowed = 0; 
    }
  
		this.saveLocalStorageToken();
		//this.setTokenContract();
		//this.getTokenState();
		this.resetTokenBalances();
    this.setBalances();
    this.startIntervalBalance();
    this.startIntervalPairs();

    
    this.getOrderbook(this.token.assetDataA.assetData, this.token.assetDataB.assetData, 1);
    
  }

  setBuys(orders){
    this.state.orders.buys = orders;
    console.log("this.state.orders.buys.length",this.state.orders.buys.length);
    
  }

  setSells(orders){
    this.state.orders.sells = orders;
    console.log("this.state.orders.sells.length",this.state.orders.sells.length);
    
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
    //console.log("log this tokens inside setBalances",this.token);
    console.log("balance A", this.token.assetDataA.balance, this.token.assetDataA.name);
    console.log("balance B", this.token.assetDataB.balance, this.token.assetDataB.name);
  
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