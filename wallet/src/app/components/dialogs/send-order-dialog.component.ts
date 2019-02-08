import { Component, Inject  } from '@angular/core'
import { Router } from '@angular/router'

import { DialogService } from '../../services/dialog.service'
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';

import { Web3 } from '../../services/web3.service'
import { AccountService } from '../../services/account.service'

import { PendingTx } from '../../models/pendingTx';
import { RawTx } from '../../models/rawtx';
import { LSCXMarketService } from '../../services/LSCX-market.service';
import BigNumber from 'bignumber.js';
import { Order } from '../../models/order';

@Component({
  selector: 'send-order-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendOrderDialogComponent{
  insufficient = false;
  protected pass;
  error = ""; 
  title = "";
  message = "";
  submited = false;

  constructor(public _web3: Web3, public _account: AccountService, private router: Router, private _LSCXmarket: LSCXMarketService,  public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendOrderDialogComponent>) {
    if(parseInt(_web3.web3.toWei(this._account.account.balance,'ether')) < data.total ){
      this.insufficient= true;
    }
  }
  async sendTx(pass){
    if (typeof(pass)=='undefined' || pass=="" || this.submited){
      return false
    }
    this.submited = true;

    let privateKey =  this.getPrivate(pass);
    if(privateKey == null) return false;
   
    let data =  await this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'order',this.data.params);
    let tx = new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), this.data.gasOpt.gasLimit, this.data.gasOpt.gasPrice, this._web3.network, data);
    await tx.setTxNonce(this._account);
    
    tx.tx.sign(privateKey);
    let serialized = "0x"+(tx.tx.serialize()).toString('hex');
    let sendResult = await this._web3.sendRawTx(serialized);
    this.dialogRef.close();
      
    if(sendResult instanceof Error){
      this.openDialogWhenError(sendResult.message);
      return false;
    }else{
      
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
        
        pending = new PendingTx(sendResult.toString(),tx.tx, this._LSCXmarket.contractMarket.address, 0, this._account.account.address);
        this._account.addPendingTx(pending);

        this.setErroParamsWhenNotConfiramtion();
        loadingDialog.close();
        let dialogRef = this.dialogService.openErrorDialog(this.title,this.message,this.error);
        dialogRef.afterClosed().subscribe(result=>{
          if(typeof(result)!= 'undefined' || result != ''){
            this.router.navigate(['/wallet/global']);
          }
        })  
      }else{
        if(loadingDialog!=null){
          loadingDialog.close();
        }
        pending.timeStamp = Date.now()/1000;
        this._account.addPendingTx(pending);
      
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

  openDialogWhenError(errorMessage) {
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

  async getOrderObject(privateKey): Promise<any>{
    this.data.params.splice(0,1);
    let order =  {
      user: this._account.account.address,
      tokenGet: this.data.params[0],
      amountGet: this.data.params[1],
      tokenGive: this.data.params[2],
      amountGive: this.data.params[3],
      expires: this.data.params[4],
      nonce: this.data.params[5],
    }
    let orderObj = new Order(order, this._LSCXmarket.token.decimals)
    let orderString = JSON.stringify(order);
    orderString = orderString.replace(/"/g,"'");
    
    this.data.params.push(orderString);
    
    this.data.params.push(this._web3.web3.toWei(orderObj.price, 'ether'));
    return orderObj;
  }

}