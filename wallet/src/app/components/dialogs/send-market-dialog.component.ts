import { Component, Inject  } from '@angular/core'
import { Router } from '@angular/router'

import { DialogService } from '../../services/dialog.service'
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';


import { Web3 } from '../../services/web3.service'
import { AccountService } from '../../services/account.service';
import { PendingTx } from '../../models/pendingTx';

import * as EthUtils from 'ethereumjs-util';
import { LSCXMarketService } from '../../services/LSCX-market.service';

@Component({
  selector: 'send-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendMarketDialogComponent{
  insufficient = false;
  protected pass;
  error = ""; 
  title = "";
  message = "";
  txs: any[];
  submited = false;
  messageTrade="";

  constructor(public _web3: Web3, public _account: AccountService, private router: Router, private _LSCXmarket: LSCXMarketService,  public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendMarketDialogComponent>) {
    if(parseInt(_web3.web3.toWei(this._account.account.balance,'ether')) < data.total ){
      this.insufficient= true;
    }
    if(typeof(this.data.tx.length) == 'undefined'){
      this.txs = [this.data.tx];
    }else{
      this.txs = this.data.tx;
    }

    if(this.data.typeFunction == "myTrades" || this.data.typeFunction == "myOrders"){
      
      let oneEther = 1000000000000000000;
      let result =this.data.amountForFee * this._LSCXmarket.fees.feeTake; 
      let amountToShow = result /oneEther;
      this.messageTrade = "This action have a market fee of "+this.data.fees+" "+this.data.tokenName;    
      
    }else{
      this.messageTrade = "";
    }
  }
   

  async sendTx(pass){
    
    if (typeof(pass)=='undefined' || pass==""|| this.submited){
      return false
    }
    this.submited = true;

    let privateKey =  this.getPrivate(pass);
    if(privateKey == null) return false;
    
    for(let i=0; i<this.txs.length; i++){
      this.txs[i].sign(privateKey);
      
      let serialized = "0x"+(this.txs[i].serialize()).toString('hex');
      let sendResult = await this._web3.sendRawTx(serialized);
      this.dialogRef.close();
      
      if(sendResult instanceof Error){
        this.openDialogWhenError(sendResult.message);
        return false;
      }else{
        this.data.functionObj.txHash = sendResult;
        let pending: any = null;
        let j = 0;
        let loadingDialog = null;
        while(pending == null && j<60){
          this.dialogRef.close();
          pending = await this._web3.getTx(sendResult);
          if(pending == null && loadingDialog==null){
            loadingDialog = this.dialogService.openLoadingDialog();
          }
          j++;
        }
        if(j==60){
          
          pending = new PendingTx(sendResult.toString(),this.txs[i], this.data.to, this.data.amount, this._account.account.address);
          this._account.addPendingTx(pending);
          if(i==this.txs.length-1){
            
            this.addToMarket();
            
            this.setErroParamsWhenNotConfiramtion();
            loadingDialog.close();
            let dialogRef = this.dialogService.openErrorDialog(this.title,this.message,this.error);
            dialogRef.afterClosed().subscribe(result=>{
                if(typeof(result)!= 'undefined' || result != ''){
                  this.router.navigate(['/wallet/global']);
                }
            })
          }
        }else{
          if(loadingDialog!=null){
            loadingDialog.close();
          }
          pending.timeStamp = Date.now()/1000;
          this._account.addPendingTx(pending);

          if(i==this.txs.length-1){
            this.addToMarket();
            this.title = "Your transaction has been sent";
            this.message = "You can see the progress in the global tab"
            
            let dialogRef = this.dialogService.openErrorDialog(this.title, this.message, this.error, this.data.action);
            dialogRef.afterClosed().subscribe(result=>{
                if(typeof(result)!= 'undefined' || result != ''){
                  this.router.navigate(['/wallet/global']);
                }
            })
          }
        }
      }
    }
  }

  closeDialog(){
    this.dialogRef.close();
  }

  getPrivate(pass):string{
    let privateKey;
    try{
      privateKey = this._account.getPrivateKey(pass)
    }catch(e){
      this.openDialogWhenError(e.message);
      privateKey = null;
    }
    return privateKey;
  }

  openDialogWhenError(errorMessage){
    this.title = "Unable to complete transaction";
    this.message = "Something went wrong"
    this.error = errorMessage;
    this.dialogRef.close();
    this.dialogService.openErrorDialog(this.title,this.message,this.error);
  }

  setErroParamsWhenNotConfiramtion(){
    this.title = "Unable to check transaction confirmation";
    this.message = "Something went wrong"
    this.error = "We can not check network confirmation, You can see the progress in the global tab";
  }

    addToMarket(){
      if(this.data.typeFunction=="listTiker"){
        this._LSCXmarket.addTikerToList(this.data.functionObj);
      }else{
        this._LSCXmarket.addMyState(this.data.functionObj, this.data.typeFunction);
      }
    }
}