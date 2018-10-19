import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service';

import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { RawTx } from '../../../models/rawtx';
import { SendDialogService } from '../../../services/send-dialog.service';
import { BigNumber } from 'bignumber.js';
import { ContractService } from '../../../services/contract.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';

@Component({
    selector: 'app-buy-sell',
    templateUrl: './buy-sell.page.html',
})
export class BuySellPage implements OnInit {
    protected action: string;
    f: any = {
      amount : undefined,
      price : undefined,
      total: 0,
      expires : 10000
    }
    private tokenAmount:number;
    private ethAmount: number;
    protected buyInCross: string;
    protected submited: boolean = false;
    private interval;
    private loadingDialog;
    constructor(public _account:AccountService, private _LSCXmarket: LSCXMarketService, private _contract: ContractService, private _dialog: DialogService,private  sendDialogService: SendDialogService, private _web3: Web3) {
        this.action = "buy";
    }

    async ngOnInit() {
      this.interval = await this._LSCXmarket.balancesInterval();
      //this._LSCXmarket.waitForMarket();
    }

    ngOnDestroy() {
      clearInterval(this.interval)
    }

    async onSubmit(form) {
      
      this.submited = true;
      if(form.invalid) return false;
      this.loadingDialog = this._dialog.openLoadingDialog();
      let price =new BigNumber(this.f.price);
      this.tokenAmount = this.f.amount*Math.pow(10,this._LSCXmarket.token.decimals);
      this.ethAmount = Math.floor(this.f.total*Math.pow(10,18));
      console.log(price, this.tokenAmount, this.ethAmount);
      let amount = (this.action == 'buy')? this.ethAmount : this.tokenAmount;

      if(this.action == "buy" && this.f.total >= this._LSCXmarket.marketBalances.eth || this.action == "sell" && this.f.amount >= this._LSCXmarket.marketBalances.token){
        this.loadingDialog.close();
        let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab.", " ");
        return false
      }
      /*
      let amount = (this.action == 'buy')? ethAmount : tokenAmount;
      let matchs = this.getCross(amount, price);
      

      if(matchs.length>0){
        let testTrade = false;
        let params = [];
          for(let i=0; (i<matchs.length || testTrade); i++){
            let order = matchs[0]
            let testParams = [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.user, order.v, order.r, order.s, amount, this._account.account.address];
            let testTrade = await this._contract.callFunction(this._LSCXmarket.contractMarket,'testTrade',testParams);
            if(testTrade) params = [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.user, order.v, order.r, order.s, amount];
          }
          if(params.length>0){
            this.trade(params)
          }else{
            this.order();
          }
      }else{
          this.order();
      }*/
      this.order();
    }

    activeButton(action) {
      this.action = action;
    }

    total() {
      let total = this.f.amount * this.f.price;
      let digits = 3
      let fact= Math.pow(10,digits);
      this.f.total = (isNaN(total))? 0 : Math.floor(total*fact)/fact;
    }

    setInCross() {
      if(this.f.total != 0 && this._LSCXmarket.marketState.orders && this._LSCXmarket.marketState.orders.sells && this._LSCXmarket.marketState.orders.sells.length > 0) {
        var bestSell = this._LSCXmarket.marketState.orders.sells[0].price;
        this.buyInCross = (this.f.price !== 0 && this.f.price > 1.5 * bestSell) ? "Your order is in cross with the best sell order in the order book (price = " + bestSell + ")." : "";
      }
    }

    getCross(amountGet, price){
      if(this.action == 'buy'){
        if("sells" in this._LSCXmarket.marketState.orders){
          return this._LSCXmarket.marketState.orders.sells.filter(x=>x.availableVolumeBase>=amountGet && parseFloat(x.price)==price);
        }else{
          return [];
        }
      }else{
        if("buys" in this._LSCXmarket.marketState.orders){
          return this._LSCXmarket.marketState.orders.buys.filter(x=>x.availableVolume>=amountGet && parseFloat(x.price)==price);
        }else{
          return [];
        }
        
      }
    }

    async order(){

      let block  = await this._web3.blockNumber();
      let ethAddr =  this._LSCXmarket.config.tokens[0].addr;
      let nonce = await this.getNonce();
      let params: any[];
      console.log(this._LSCXmarket.marketBalances.eth, this._LSCXmarket.marketBalances.token);
      if(this.action == "buy" && this.f.total <= this._LSCXmarket.marketBalances.eth){
          params = [this._LSCXmarket.token.addr, this.tokenAmount, ethAddr, this.ethAmount, block + this.f.expires, nonce]
      } else if (this.action == "sell" && this.f.amount <= this._LSCXmarket.marketBalances.token){
          params = [ethAddr, this.ethAmount, this._LSCXmarket.token.addr, this.tokenAmount, block +this.f.expires, nonce]
      }
     
      let hashParams : any[]= [this._LSCXmarket.contractMarket.address].concat(params);
      console.log("Buy/sell", params, hashParams);
      this.loadingDialog.close();
      let gasOpt = await this.openGasDialog(this._LSCXmarket.config.gasOrder);
        if(gasOpt != null){
          let gas = gasOpt.gasLimit * gasOpt.gasPrice;
          this.sendDialogService.openConfirmOrder(this._LSCXmarket.contractMarket.address, gas, "order", hashParams, gasOpt);
        }
    }

    async trade(params){
        let data = await this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'trade',params);
        this.loadingDialog.close();
        let gasOpt = await this.openGasDialog(this._LSCXmarket.config.gasTrade);
        if(gasOpt != null){
          let tx = new RawTx(this._account,this._LSCXmarket.contractMarket.address,new BigNumber(0),gasOpt.gasLimit, gasOpt.gasPrice, this._web3.network, data);
          this.sendDialogService.openConfirmSend(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount,tx.gas, tx.cost, "send");
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
    //para ver ultimo nonce real
    let history = this._account.account.history.filter(x=> x.from.toLowerCase() ==this._account.account.address);
    let historyNonce =history[0].nonce;
    console.log(history[0].nonce, historyNonce);
    if(historyNonce>= nonce){
        nonce = parseInt(historyNonce)+1;
    }
    return nonce;
  }

}
