import { Component, OnInit, DoCheck } from '@angular/core'
import { MdDialog} from '@angular/material';
import { Router } from '@angular/router';

import { AccountService } from '../../../services/account.service';

import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { RawTx } from '../../../models/rawtx';
import { SendDialogService } from '../../../services/send-dialog.service';
import { BigNumber } from 'bignumber.js';
import { ContractService } from '../../../services/contract.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { ZeroExService } from "../../../services/0x.service";

import { ZeroExConfirmDialogComponent } from "../../dialogs/zeroExConfirm-dialog.component";
import { EtherscanService } from "../../../services/etherscan.service";
import { Trade } from '../../../models/trade';
import { Order } from '../../../models/order';

import * as EthWallet from 'ethereumjs-wallet'

@Component({
    selector: 'app-buy-sell',
    templateUrl: './buy-sell.page.html',
})
export class BuySellPage implements OnInit, DoCheck {
    protected action: string;
    f: any = {
      amount : undefined,
      price : undefined,
      total: 0,
      expires : 10000,
      type: 'hours'
    }
    private tokenAmount:number;
    private ethAmount: number;
    protected submited: boolean = false;
    private amount: number;
    private loadingDialog;
    protected bestSell;
    protected bestBuy;
    protected bestSellWeth;
    protected bestBuyWeth;
    protected expiresBigNumber;
    lastDisplay;
    minAmount;
    pairBalance;
    balanceError = '';
    constructor(private router: Router, public dialog: MdDialog, public _zeroEx: ZeroExService,  public _account:AccountService, public _LSCXmarket: LSCXMarketService, private _contract: ContractService, private _dialog: DialogService,private  sendDialogService: SendDialogService, private _web3: Web3, public _scan: EtherscanService) {
        this.action = "buy";
    }

    async ngOnInit() {
      await this._LSCXmarket.setBalancesInterval();
      await this._LSCXmarket.setStateOrdersInterval();
      
      if(this._LSCXmarket.state.orders.sells.length != 0){
        let sellLength = this._LSCXmarket.state.orders.sells.length;          
        this.bestSell = this._LSCXmarket.state.orders.sells[sellLength -1].price;
      }
      
      if(this._LSCXmarket.state.orders.buys.length != 0){
        let buyLength = this._LSCXmarket.state.orders.buys.length;
        this.bestBuy = this._LSCXmarket.state.orders.buys[0].price;
      }
      
      
      if(this._zeroEx.state.orders.sells.length != 0){
        let sellLength = this._zeroEx.state.orders.sells.length;
        this.bestSellWeth = this._zeroEx.state.orders.sells[0].priceTokenB;
      }
      if(this._zeroEx.state.orders.buys.length != 0){
        let buyLength = this._zeroEx.state.orders.buys.length;
        this.bestBuyWeth = this._zeroEx.state.orders.buys[0].priceTokenB;
      }
    
      
      this.lastDisplay = this._zeroEx.display;
      if(this._zeroEx.display == 'weth'){
        this.f.expires = 1;
      }
      if(this._zeroEx.display == 'eth'){
          this.minAmount = 0.001;
      }
      if(this._zeroEx.display == 'weth'){
        if(this.action == 'buy'){
          let decimalsString = this._zeroEx.token.assetDataB.decimals.toString();
          let exp = 10 ** parseInt(decimalsString);
          this.minAmount = this._zeroEx.token.assetDataB.minAmount/exp;
          this.pairBalance = this._zeroEx.token.assetDataB.balance;
        }
        if(this.action == 'sell'){
          let decimalsString = this._zeroEx.token.assetDataA.decimals.toString();
          let exp = 10 ** parseInt(decimalsString);
          this.minAmount = this._zeroEx.token.assetDataA.minAmount/exp;
          this.pairBalance = this._zeroEx.token.assetDataA.balance;
        }
      }
    }

    ngDoCheck() {
      if(this.lastDisplay != this._zeroEx.display){
        
        if(this._zeroEx.display == 'eth'){
            this.minAmount = 0.001;
            this.f.expires = 10000;
        }
        if(this._zeroEx.display == 'weth'){  
            this.f.expires = 1;
            if(this.action == 'buy'){
              let decimalsString = this._zeroEx.token.assetDataB.decimals.toString();
              let exp = 10 ** parseInt(decimalsString);
              this.minAmount = this._zeroEx.token.assetDataB.minAmount/exp;
              this.pairBalance = this._zeroEx.token.assetDataB.balance;
            }
            if(this.action == 'sell'){
              let decimalsString = this._zeroEx.token.assetDataA.decimals.toString();
              let exp = 10 ** parseInt(decimalsString);
              this.minAmount = this._zeroEx.token.assetDataA.minAmount/exp;
              this.pairBalance = this._zeroEx.token.assetDataA.balance;
            }
        }
        this.lastDisplay = this._zeroEx.display;
      } 
    }

    ngOnDestroy() {
      this._LSCXmarket.clearBalancesInterval();
      this._LSCXmarket.clearStateOrdersInterval();
    }

    async onSubmit(form){ 
      this.submited = true;
      if(form.invalid) return false;
      if(this._zeroEx.display == "eth"){
        this.loadingDialog = this._dialog.openLoadingDialog();
        let price =new BigNumber(this.f.price);
        this.tokenAmount = this.f.amount*Math.pow(10,this._LSCXmarket.token.decimals);
        this.ethAmount = Math.floor(this.f.total*Math.pow(10,18));
        this.amount = (this.action == 'buy')? this.ethAmount : this.tokenAmount;
        
        if(this.action == "buy" && this.f.total > this._LSCXmarket.marketBalances.eth || this.action == "sell" && this.f.amount > this._LSCXmarket.marketBalances.token){
          this.loadingDialog.close();
          //calculate market fee, if buy you'll need f.total + feeMarket
          if(this.action=="buy"){
            let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab.", " ");
          }
          if(this.action =="sell"){
            let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab.", " ");
          }
          return false
        }
        
        let amountCross = (this.action == 'buy')? this.f.total : this.f.amount;
        let matchs = await this.getCross(amountCross, this.f.price);
        if(matchs.length > 0){
          let testTrade = false;
          let params = [];
          let order: any;
          for(let i=0; (i < matchs.length && !testTrade); i++){
              order = matchs[i];
              let testParams = [order.tokenGet,order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user,  this.amount, this._account.account.address];
              let testTradeResp = await this._contract.callFunction(this._LSCXmarket.contractMarket,'testTrade',testParams);
              testTrade = (testTradeResp.toString() == "true")? true: false;
              
              if(testTrade) params = [order.tokenGet,order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user, this.amount];
          }
          if(params.length > 0){
              this.trade(params, order);
          }else{
              this.order();
            }
        }else{
            this.order();
        }
      }
      if(this._zeroEx.display == 'weth'){
        let obj ={
          form:form.controls,
          token:this._zeroEx.token
        }
        let confirm = this.dialog.open(ZeroExConfirmDialogComponent, {
          width: '660px',
          height: '350px',
          data: {
              form: form.controls,
              token: this._zeroEx.token,
              action: this.action
          }
        });
        confirm.afterClosed().subscribe(async result=>{
          if(result != null){
            let loading = this._dialog.openLoadingDialog();
            let error = "";
            let wallet;
            let pass = result;
            try{
              wallet = EthWallet.fromV3(this._account.account.v3, pass);
            }catch(e){
              error= e.message;
            }
            if(error==""){
              try {
                this._zeroEx.order(form.controls.amount.value, form.controls.expires.value, form.controls.price.value, form.controls.total.value, form.controls.type.value, this.action, pass);

                let title = "Your order has been sent";
                let message = "This action may take some time to appear in the orderbook"
                loading.close();
                let dialogRef = this._dialog.openErrorDialog(title, message, error);
                dialogRef.afterClosed().subscribe(async result=>{
                  this.router.navigate(['/market/history']);  
                });
                
              } catch (error) {
                loading.close();
                let title = 'Unable to send order';
                let message = 'Something was wrong';
                let dialogRef = this._dialog.openErrorDialog(title, message, error);   
              }
              
            }else{
              loading.close();
              let title = 'Unable to export account';
              let message = 'Something was wrong';
              let dialogRef = this._dialog.openErrorDialog(title, message, error);   
            }  
          }
      });
        
        
      }
    }

    activeButton(action){
      this.action = action;
      if(this._zeroEx.display == 'weth'){
        if(this.action == 'buy'){
          let decimalsString = this._zeroEx.token.assetDataB.decimals.toString();
          let exp = 10 ** parseInt(decimalsString);
          this.minAmount = this._zeroEx.token.assetDataB.minAmount/exp;
          this.pairBalance = this._zeroEx.token.assetDataB.balance;
        }
        if(this.action == 'sell'){
          let decimalsString = this._zeroEx.token.assetDataA.decimals.toString();
          let exp = 10 ** parseInt(decimalsString);
          this.minAmount = this._zeroEx.token.assetDataA.minAmount/exp;
          this.pairBalance = this._zeroEx.token.assetDataA.balance;
        }
      }
      if(this._zeroEx.display == 'eth'){
        this.minAmount = 0.001;
        this.f.expires = 10000;
      }
        
      
    }

    total() {
      let amount = new BigNumber(this.f.amount)
      let price = new BigNumber(this.f.price);
      let totalBN = amount.multipliedBy(price)
      let total = totalBN.toNumber();
      
      if(this._zeroEx.display == 'eth'){

        this.f.total = (isNaN(total))? 0 : total;
      }else{
        if(this._zeroEx.display == 'weth'){
            if(this.action == 'buy'){
              if(total < this.minAmount || total > this.pairBalance){ 
                if(total > this.pairBalance){
                  this.balanceError = "The amount to pay is higher than your balance";
                }
                  this.submited = true;
                  this.f.total = 0;
                  return false
              }else{
                this.balanceError = '';
                this.f.total = (isNaN(total))? 0 : total;  
              }
            }
            if(this.action == 'sell'){
              if(this.f.amount < this.minAmount || this.f.amount > this.pairBalance){
                if(this.f.amount > this.pairBalance){
                  this.balanceError = "The amount to pay is higher than your balance";
                }
                  this.submited = true;
                  this.f.total = 0;
                  return false
              }else{
                this.balanceError = '';
                this.f.total = (isNaN(total))? 0 : total;
              }
            }
          }
      }
    }

    async getCross(amount, price){
      let blockNumber = await this._web3.blockNumber();
      let ordersToCross =[];
      if(this.action == 'buy'){
        ordersToCross = this._LSCXmarket.state.orders.sells;
      }else{
        ordersToCross = this._LSCXmarket.state.orders.buys;
      }    
      return ordersToCross.filter(x=>{ return x.available>=amount && parseFloat(x.price)==price && x.expires>blockNumber && x.user.toLowerCase() !=this._account.account.address.toLowerCase()});
    }

    async order(){
      let block  = await this._web3.blockNumber();
      let ethAddr =  this._LSCXmarket.config.tokens[0].addr;
      let nonce = await this.getNonce();
      let params: any[];
      if(this.action == "buy" && this.f.total <= this._LSCXmarket.marketBalances.eth){
          params = [this._LSCXmarket.token.addr, this.tokenAmount, ethAddr, this.ethAmount, block + this.f.expires, nonce]
      } else if (this.action == "sell" && this.f.amount <= this._LSCXmarket.marketBalances.token){
          params = [ethAddr, this.ethAmount, this._LSCXmarket.token.addr, this.tokenAmount, block +this.f.expires, nonce]
      }
      let order =  {
        user: this._account.account.address,
        tokenGet: params[0],
        amountGet: params[1],
        tokenGive: params[2],
        amountGive: params[3],
        expires: params[4],
        nonce: params[5],
        price: this.f.price
      }
      let orderObj = new Order(order, this._LSCXmarket.token.decimals);
      let orderString = JSON.stringify(order);
      orderString = orderString.replace(/"/g,"'");
      
      params.push(orderString);
      
      params.push(this._web3.web3.toWei(orderObj.price, 'ether'));
      let data =  await this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'order',params);
      
      let gasLimit;
        try{
          gasLimit = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data, 0);
        }catch(e){
          gasLimit = this._LSCXmarket.config.gasOrder;
        }

      this.loadingDialog.close();
      let gasOpt = await this.openGasDialog(gasLimit);
        if(gasOpt != null){
          let tx = new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice, this._web3.network, data);
          let fees = this.getFees("order");
          let tokenName = (this.action == "buy")? this._LSCXmarket.token.name : "ETH";
          this.sendDialogService.openConfirmMarketOrders(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount, tx.gas, tx.cost, "send", "myOrders",orderObj, fees, tokenName);
        }
    }

    async trade(params, order){
        let data = await this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'trade',params);  
        this.loadingDialog.close();
        let gasLimit;
        try{
          gasLimit = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data, 0);
        }catch(e){
          gasLimit = this._LSCXmarket.config.gasTrade;
        }

        let gasOpt = await this.openGasDialog(gasLimit);

        if(gasOpt != null){
          let nonce = await this.getNonce(); 
          let tx = new RawTx(this._account,this._LSCXmarket.contractMarket.address,new BigNumber(0),gasOpt.gasLimit, gasOpt.gasPrice, this._web3.network, data);
          let tradeObj = new Trade(this.action, order.tokenGet, order.tokenGive, this.f.amount, this.f.total, this.f.price, this._account.account.address, order.user, nonce, params[7]);             
          let fees = this.getFees("trade");
          let tokenName = (this.action == "buy")? "ETH": this._LSCXmarket.token.name;
          this.sendDialogService.openConfirmMarketOrders(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount, tx.gas, tx.cost, "send", "myTrades", tradeObj, fees, tokenName);
        }  
    }

    async openGasDialog(gasLimit){
      let dialogRef = this._dialog.openGasDialog(gasLimit, 1);
      let result = await dialogRef.afterClosed().toPromise();
      
      if(typeof(result) != 'undefined'){
          let obj = JSON.parse(result);
          return obj;
      }
      return null;
  }

  async getNonce(){
    let nonce = await this._web3.getNonce(this._account.account.address);
    
    let history = this._account.account.history.filter(x=> x.from.toLowerCase() ==this._account.account.address);
    let historyNonce = history[0].nonce;
    
    if(historyNonce>= nonce){
        nonce = parseInt(historyNonce)+1;
    }
    return nonce;
  }

  getFees(typeOrder): number{
    let eth = parseInt(this._web3.web3.toWei(1, "ether"));
    let fees = 0;
    if(typeOrder=="order") {
      let amount = (this.action == "buy")? this.tokenAmount : this.ethAmount;
      fees = (amount*this._LSCXmarket.fees.feeMake)/eth;
      
    } else {
      fees = (this.amount*this._LSCXmarket.fees.feeTake)/eth;
    }
    if(this.action == "buy" && typeOrder == "trade" || this.action == "sell" && typeOrder == "order" ) {
      fees = fees/Math.pow(10,18);
    } else {
      fees = fees/Math.pow(10,this._LSCXmarket.token.decimals);
    }
    return fees;
  }

  openExternal(){
    if(this._zeroEx.display == 'eth'){
      this._scan.openTokenUrl(this._LSCXmarket.token.addr)
    }
    if(this._zeroEx.display == 'weth'){
      this._scan.openTokenUrl(this._zeroEx.token.assetDataA.tokenAddress)
      this._scan.openTokenUrl(this._zeroEx.token.assetDataB.tokenAddress)
    }
  }
}
