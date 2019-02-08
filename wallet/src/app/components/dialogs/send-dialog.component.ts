import { Component, Inject  } from '@angular/core';
import { Router } from '@angular/router';

import { DialogService } from '../../services/dialog.service';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';


import { Web3 } from '../../services/web3.service';
import { AccountService } from '../../services/account.service';

import { LSCX_Contract } from '../../models/LSCX_contract';
import { ContractStorageService } from '../../services/contractStorage.service';

import { AlternativeSending } from '../../models/alternativeSending';

import * as EthUtils from 'ethereumjs-util';

@Component({
  selector: 'send-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendDialogComponent{
  insufficient = false;
  protected pass;
  error = ""; 
  title = "";
  message = "";
  txs: any[];
  submited = false;

  constructor(public _web3: Web3, public _account: AccountService, private router: Router, public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendDialogComponent>, private _contractStorage: ContractStorageService) {
    
    if(parseInt(_web3.web3.toWei(this._account.account.balance,'ether')) < data.total ){
      this.insufficient= true;
    }
    if(typeof(this.data.tx.length) == 'undefined'){
      this.txs = [this.data.tx];
    }else{
      this.txs = this.data.tx;
    }
  }
   

  async sendTx(pass){
    if (typeof(pass)=='undefined' || pass=="" || this.submited){
      return false
    }
    this.submited = true;

    if('seedOptions' in this.data) {
      let seedOptions = this.data.seedOptions
      let alternativeSending = new AlternativeSending(seedOptions.seed, seedOptions.to, this._account.account.address, "hash", this.data.amount.toString(), this._web3.network);
      
      return false
    }
    
    
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
          
          pending = this.createPendingObject(sendResult, i);
          
          this._account.addPendingTx(pending);
          if(i==this.txs.length-1){
            this.setErroParamsWhenNotConfiramtion();
            loadingDialog.close();
            let dialogRef = this.dialogService.openErrorDialog(this.title,this.message,this.error);
            dialogRef.afterClosed().subscribe(result=>{
                if(typeof(result)!= 'undefined' || result != ''){
                  this.router.navigate(['/wallet/global']);
                }
            })
          }
        } else {
          if(loadingDialog!=null){
            loadingDialog.close();
          }
          if(this.data.action != 'approve'){
            pending.timeStamp = Date.now()/1000;
            this._account.addPendingTx(pending);
          }
          
          if(this.data.action == 'contractDeploy'){
            this.addLSCXContract(sendResult);
          }
          if(i==this.txs.length-1 && this.data.action != 'approve'){
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
    this.dialogRef.close(JSON.stringify({message: "Back"}));
    
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

  addLSCXContract(hash) {
    let contract =  new LSCX_Contract();
    contract.deployContract(hash, this.data.contract.info, this.data.contract.type, this._account.account.address, this._web3.network.chain);
    this._contractStorage.addContract(contract);
    this._contractStorage.checkForAddress();
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

  createPendingObject(hash, index){
    let obj ={
      hash: hash,
      nonce: EthUtils.bufferToInt(this.txs[index].nonce),
      from: this._account.account.address,
      to: this.data.to,
      value: this.data.amount,
      gas:EthUtils.bufferToInt(this.txs[index].gasLimit),
      gasPrice:parseInt(EthUtils.bufferToHex(this.txs[index].gasPrice)),
      input: EthUtils.bufferToHex(this.txs[index].data),
      timeStamp: Date.now()/1000
    }
    return obj
  }

}
