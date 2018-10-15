import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service';

import { MarketService } from '../../../services/market.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { RawTx } from '../../../models/rawtx';
import { SendDialogService } from '../../../services/send-dialog.service';
import { BigNumber } from 'bignumber.js';
import { ContractService } from '../../../services/contract.service';

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
    protected buyInCross: string;
    protected submited: boolean = false;
    private interval;
    private loadingDialog;
    constructor(public _account:AccountService, private _market: MarketService, private _contract: ContractService, private _dialog: DialogService,private  sendDialogService: SendDialogService, private _web3: Web3) {
        this.action = "buy";
    }

    async ngOnInit() {
      this.interval = await this._market.balancesInterval();
      this._market.waitForMarket();
    }

    ngOnDestroy() {
      clearInterval(this.interval)
    }

    async onSubmit(form) {
      
      this.submited = true;
      if(form.invalid) return false;
      this.loadingDialog = this._dialog.openLoadingDialog();
      let price =new BigNumber(this.f.price);
      let tokenAmount = this.f.amount*Math.pow(10,this._market.token.decimals);
      let ethAmount = Math.floor(this.f.total*Math.pow(10,18));

      if(this.action == "buy" && this.f.total >= this._market.etherdeltaBalances.eth || this.action == "sell" && this.f.amount >= this._market.etherdeltaBalances.token){
        this.loadingDialog.close();
        let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab.", " ");
        return false
      }
      
      let amount = (this.action == 'buy')? ethAmount : tokenAmount;
      let matchs = this.getCross(amount, price);
      

      if(matchs.length>0){
        let testTrade = false;
        let params = [];
          for(let i=0; (i<matchs.length || testTrade); i++){
            let order = matchs[0]
            let testParams = [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.user, order.v, order.r, order.s, amount, this._account.account.address];
            let testTrade = await this._contract.callFunction(this._market.contractEtherDelta,'testTrade',testParams);
            if(testTrade) params = [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.user, order.v, order.r, order.s, amount];
          }
          if(params.length>0){
            this.trade(params)
          }else{
            this.order();
          }
      }else{
          this.order();
      }
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
      if(this.f.total != 0 && this._market.state.orders && this._market.state.orders.sells && this._market.state.orders.sells.length > 0) {
        var bestSell = this._market.state.orders.sells[0].price;
        this.buyInCross = (this.f.price !== 0 && this.f.price > 1.5 * bestSell) ? "Your order is in cross with the best sell order in the order book (price = " + bestSell + ")." : "";
      }
    }

    getCross(amountGet, price){
      if(this.action == 'buy'){
        if("sells" in this._market.state.orders){
          return this._market.state.orders.sells.filter(x=>x.availableVolumeBase>=amountGet && parseFloat(x.price)==price);
        }else{
          return [];
        }
      }else{
        if("buys" in this._market.state.orders){
          return this._market.state.orders.buys.filter(x=>x.availableVolume>=amountGet && parseFloat(x.price)==price);
        }else{
          return [];
        }
        
      }
    }

    async order(){

      let block  = await this._web3.blockNumber();
      let ethAddr =  this._market.config.tokens[0].addr;
      let nonce = await this._web3.getNonce(this._account.account.address);
      let tokenAmount = this.f.amount*Math.pow(10,this._market.token.decimals);
      let ethAmount = Math.floor(this.f.total*Math.pow(10,18));

      let params: any[];

      if(this.action == "buy" && this.f.total <= this._market.etherdeltaBalances.eth){
          params = [this._market.token.addr, tokenAmount, ethAddr, ethAmount, block + this.f.expires, nonce]
      } else if (this.action == "sell" && this.f.amount <= this._market.etherdeltaBalances.token){
          params = [ethAddr, ethAmount, this._market.token.addr, tokenAmount, block +this.f.expires, nonce]
      }
      let hashParams : any[]= [this._market.contractEtherDelta.address].concat(params);
              
      let data =  await this._market.getFunctionData(this._market.contractEtherDelta,'order',params);
      this.loadingDialog.close();
      let gasOpt = await this.openGasDialog(this._market.config.gasOrder);
        if(gasOpt != null){
          let tx = new RawTx(this._account,this._market.contractEtherDelta.address,new BigNumber(0),gasOpt.gasLimit, gasOpt.gasPrice, this._web3.network, data);
          //let tx = await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0, {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice });
          this.sendDialogService.openConfirmOrder(tx.tx, this._market.contractEtherDelta.address, tx.amount,tx.gas, tx.cost, "order", hashParams);
        }
    }

    async trade(params){
        let data = await this._market.getFunctionData(this._market.contractEtherDelta,'trade',params);
        this.loadingDialog.close();
        let gasOpt = await this.openGasDialog(this._market.config.gasTrade);
        if(gasOpt != null){
          let tx = new RawTx(this._account,this._market.contractEtherDelta.address,new BigNumber(0),gasOpt.gasLimit, gasOpt.gasPrice, this._web3.network, data);
          this.sendDialogService.openConfirmSend(tx.tx, this._market.contractEtherDelta.address, tx.amount,tx.gas, tx.cost, "send");
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

}
