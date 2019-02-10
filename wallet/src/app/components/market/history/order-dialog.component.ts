import { Component,  Inject, } from '@angular/core';
import { MdDialogRef, MdDialog, MD_DIALOG_DATA} from '@angular/material';

import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { AccountService } from '../../../services/account.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { ContractService } from '../../../services/contract.service';
import { ZeroExService } from "../../../services/0x.service";

import { RawTx } from '../../../models/rawtx';
import BigNumber from 'bignumber.js';
import { Trade } from '../../../models/trade';
import { Order } from '../../../models/order';

import * as EthWallet from 'ethereumjs-wallet';
@Component({
    selector: 'order-dialog',
    templateUrl: './order-dialog.component.html'
})

export class OrderDialogComponent {
    submited = false;
    totalSumbit = false;
   
    protected action: string;
    f: any = {
      amount : undefined,
      price : undefined,
      total: 0,
      expires : 10000,
      pass: undefined
    }
    private tokenAmount:number;
    private ethAmount: number;
    private amount: number;
    private loadingDialog;
    protected bestSell;
    protected bestBuy;
    pass;
    balanceError = '';
    minAmount;
    constructor(@Inject(MD_DIALOG_DATA) public data: any,public _zeroEx:ZeroExService,private _contract: ContractService, private dialog: MdDialog, private _account: AccountService, public _LSCXmarket: LSCXMarketService,  public dialogRef: MdDialogRef<OrderDialogComponent>, private _web3: Web3, private _dialog: DialogService, private sendDialogService: SendDialogService){
        if(this.data.display == 'eth'){
            this.minAmount = 0.001;
            this.f.price = data.price;
        }
        if(this.data.display == 'weth'){
            this.minAmount = data.minAmount;
            this.f.price = data.priceTokenB;  
        }
              
        if(this.data.action == "buy"){
            this.action = "sell";
        }
        if(this.data.action == "sell"){
            this.action = "buy"
        }
    }
    closeDialog(){
        this.dialogRef.close();
    }

    async confirm(form){        
        if(this.data.display == 'eth'){
            this.submited = true;
            if(form.invalid) return false;
            this.loadingDialog = this._dialog.openLoadingDialog();
            let price = new BigNumber(this.f.price);
            
            this.tokenAmount = this.f.amount*Math.pow(10,this._LSCXmarket.token.decimals);
            this.ethAmount = Math.floor(this.f.total*Math.pow(10,18));
            
            this.amount = (this.action == 'buy')? this.ethAmount : this.tokenAmount;
                
            if(this.action == "buy" && this.f.total > this._LSCXmarket.marketBalances.eth || this.action == "sell" && this.f.amount > this._LSCXmarket.marketBalances.token){
                this.loadingDialog.close();
                //calculate market fee, if buy you'll need f.total + feeMarket
                if(this.action == "buy"){
                let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab.", " ");
                }
                if(this.action == "sell"){
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
                order = this.data;
                let testParams = [order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user,  this.f.amount, this._account.account.address];
                let testTradeResp = await this._contract.callFunction(this._LSCXmarket.contractMarket,'testTrade',testParams);
                
                testTrade = (testTradeResp.toString() == "true")? true: false;
                if(testTrade) params = [order.tokenGet,order.amountGet, order.tokenGive, order.amountGive, order.expires, order.nonce, order.user, this.amount];
                if(params.length > 0){
                    this.trade(params, order);
                }
                this.dialogRef.close();
            }else{
                this.loadingDialog.close();
                if(this.data.user == this._account.account.address){
                    let dialogRef = this._dialog.openErrorDialog('Unable to fill this order', "You can't fill your own order", " ");
                }
            }
        }
        if(this.data.display == 'weth'){
            this.submited = true;
            if(form.invalid) return false;
            let is_Valid = await this._zeroEx.validateFillOrder(this.data ,this.f.amount,this._account.account.address);
            if(is_Valid == true){
                this.dialogRef.close(this.f.pass);
                this.dialogRef.afterClosed().subscribe(async result=>{
                    let wallet;
                    let error= "";
                    if(result != null){
                        try{
                            wallet = EthWallet.fromV3(this._account.account.v3, result);
                        }catch(e){
                            error= e.message;
                        }
                        if(error==""){
                            this.loadingDialog = this._dialog.openLoadingDialog();
                            try {
                                await this._zeroEx.fillOrder(this.data ,this.f.amount,this._account.account.address, result);    
                            } catch (error) {
                                console.log(error);
                                this.loadingDialog.close();    
                            }
                            this.loadingDialog.close();
                        }else{
                            let dialogRef = this._dialog.openErrorDialog('Unable to fill this order', error, " ");
                        }           
                    }
                });
            }else{
                this.dialogRef.close();
                let dialogRef = this._dialog.openErrorDialog('Unable to fill this order', "Validate fill order error, please check token allowance", " ");
            }
        }
    }
   
    total() {
        let amount = new BigNumber(this.f.amount)
        let price = new BigNumber(this.f.price);
        let totalBN = amount.multipliedBy(price)
        let total = totalBN.toNumber()
        if(this.data.display == 'eth'){
            if(this.data.action == "sell"){
                if(total > this.data.available){
                    this.totalSumbit = true;
                    this.submited = true;
                    this.f.total = 0;
                    return false;
                }else{
                    this.f.total = (isNaN(total))? 0 : total;
                }
            }
            if(this.data.action == "buy"){
                if(this.f.amount > this.data.available){
                    this.totalSumbit = true;
                    this.submited = true;
                    this.f.total = 0;
                    return false
                }else{                    
                    this.f.total = (isNaN(total))? 0 : total;
                }
            }
        }
        if(this.data.display == 'weth'){
            if(
                (this.f.amount > this.data.remainingAmount) || 
                (this.f.amount < this.data.minAmount) || 
                (this.data.takerData.tokenAddress == this._zeroEx.token.assetDataB.tokenAddress && 
                        (this.f.amount > this._zeroEx.token.assetDataB.balance || this.f.amount > this.data.remainingAmount)) || 
                (this.data.takerData.tokenAddress == this._zeroEx.token.assetDataA.tokenAddress && 
                    (this.f.amount > this._zeroEx.token.assetDataA.balance || this.f.amount > this.data.remainingAmount))){
                        
                if(this.f.amount > this._zeroEx.token.assetDataA.balance){
                    this.balanceError = "The amount to pay is higher than your balance";
                }
                this.totalSumbit = true;
                this.submited = true;
                this.f.total = 0;
                return false
            }else{
                this.f.total = (isNaN(total))? 0 : total;
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
}