import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service';

import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { RawTx } from '../../../models/rawtx';
import { SendDialogService } from '../../../services/send-dialog.service';
import { BigNumber } from 'bignumber.js';
import { ContractService } from '../../../services/contract.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';

import { Trade } from '../../../models/trade';
import { Order } from '../../../models/order';

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
    protected submited: boolean = false;
    private loadingDialog;
    constructor(public _account:AccountService, private _LSCXmarket: LSCXMarketService, private _contract: ContractService, private _dialog: DialogService,private  sendDialogService: SendDialogService, private _web3: Web3) {
        this.action = "buy";
    }

    async ngOnInit() {
      await this._LSCXmarket.setBalancesInterval();
      await this._LSCXmarket.setStateOrdersInterval();
    }

    ngOnDestroy() {
      this._LSCXmarket.clearBalancesInterval();
      this._LSCXmarket.clearStateOrdersInterval();
    }

    async onSubmit(form) {
      
      this.submited = true;
      if(form.invalid) return false;
      this.loadingDialog = this._dialog.openLoadingDialog();
      let price =new BigNumber(this.f.price);
      console.log(price, price.toNumber())
      this.tokenAmount = this.f.amount*Math.pow(10,this._LSCXmarket.token.decimals);
      this.ethAmount = Math.floor(this.f.total*Math.pow(10,18));
      console.log(price, this.tokenAmount, this.ethAmount);
      let amount = (this.action == 'buy')? this.ethAmount : this.tokenAmount;
        
        //change to > to get total
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
      console.log("AmountCross?!?!?!",amountCross);
      console.log("this.f.price", this.f.price);
      
      
      console.log("matchs!!!!!?!!??!?!?!?!!?!?!",matchs);
      
      if(matchs.length>0){
        let testTrade = false;
        let params = [];
        let order: any;
        console.log("entras aqui?");
        
        for(let i=0; (i<matchs.length && !testTrade); i++){
            order = matchs[i];
            console.log(matchs[i])
            let testParams = [order.tokenGet,order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user,  amount, this._account.account.address];
            let testTrade = await this._contract.callFunction(this._LSCXmarket.contractMarket,'testTrade',testParams);
            //console.log("Que es order?", order); //es el order del match
            //console.log("Que es testTrade?",testTrade);
            if(testTrade) params = [order.tokenGet,order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user, amount];
        }

        if(params.length>0){
          console.log("trade", order)
            this.trade(params, order);
        }else{
          console.log("order despues de match")
            this.order();
          }
      }else{
          console.log("order")
          this.order();
      }
    }

    activeButton(action){
      console.log("action???",action);
      
      this.action = action;
    }

    total() {
      let total = this.f.amount * this.f.price;
      let digits = 3
      let fact= Math.pow(10,digits);
      this.f.total = (isNaN(total))? 0 : Math.floor(total*fact)/fact;
      console.log(this.f.total)
    }

    async getCross(amount, price){
      let blockNumber = await this._web3.blockNumber();
      let ordersToCross =[];
      if(this.action == 'buy'){
        ordersToCross = this._LSCXmarket.state.orders.sells;
      }else{
        ordersToCross = this._LSCXmarket.state.orders.buys;
      }
      console.log("ORDERS TO CROSS???",ordersToCross);      
      //console.log("FILTER DE ORDERS TO CROSS?",ordersToCross.filter(x=>x.available>=amount && parseFloat(x.price)==price && x.expires>blockNumber));     
      return ordersToCross.filter(x=>x.available>=amount && parseFloat(x.price)==price && x.expires>blockNumber);
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
      }
      let orderObj = new Order(order, this._LSCXmarket.token.decimals);
      let orderString = JSON.stringify(order);
      orderString = orderString.replace(/"/g,"'");
      //add _string
      params.push(orderString);
      //add _price
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
          this.sendDialogService.openConfirmMarket(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount, tx.gas, tx.cost, "send", "myOrders",orderObj);
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
          
          this.sendDialogService.openConfirmMarket(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount, tx.gas, tx.cost, "send", "myTrades", tradeObj);
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
    let historyNonce = history[0].nonce;
    console.log(history[0].nonce, historyNonce);
    if(historyNonce>= nonce){
        nonce = parseInt(historyNonce)+1;
    }
    return nonce;
  }
}
