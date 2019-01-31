import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA, MdDialog} from '@angular/material';
import { Router } from '@angular/router';

import { AccountService } from '../../services/account.service';
import { ContractService } from "../../services/contract.service";
import { Web3 } from '../../services/web3.service';
import { ZeroExService } from "../../services/0x.service";

import { ErrorDialogComponent } from './error-dialog.component';
import { LoadingDialogComponent } from './loading-dialog.component';

import { RawTx } from '../../models/rawtx';

import BigNumber from 'bignumber.js';
import * as EthUtils from 'ethereumjs-util';

@Component({
    selector: 'send-weth',
    templateUrl: './send-weth-dialog.component.html'
})

export class SendWethDialogComponent implements OnInit{
    submited = false;
    error = ""; 
    title = "";
    message = "";
    constructor(@Inject(MD_DIALOG_DATA) public data: any, private router: Router, private _contract : ContractService, public _zeroEx: ZeroExService, public _account: AccountService, public dialogRef: MdDialogRef<SendWethDialogComponent>, private _web3: Web3, public dialog: MdDialog){
    
    }
    
    ngOnInit(){

    }

    closeDialog(){
        this.dialogRef.close();
    }
    async setTxNonce(account: any){
        let _web3 = new Web3();
        let nonce = await _web3.getNonce(account.account.address);
        
        let history = account.account.history.filter(x=> x.from.toLowerCase() == account.account.address);
        if(history.length > 0) {
            let historyNonce = history[0].nonce;
            
            if(historyNonce >= nonce){
                nonce = parseInt(historyNonce)+1;
            }
        }
        return nonce;
    }

    async sendTx(pass){
        
        if (typeof(pass)=='undefined' || pass=="" || this.submited){
            return false
        }
        this.submited = true;
        
        let privateKey =  this.getPrivate(pass);
        if(privateKey == null) return false;
        
        this.dialogRef.close(JSON.stringify({status: "OK", key: pass}));
        
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
        let title = "Unable to complete transaction";
        let message = "Something went wrong"
        let error = errorMessage;
        this.dialogRef.close();
        let errorDialog = this.dialog.open(ErrorDialogComponent, {
            width: '660px',
            height: '210px',
            data: {
              title: title,
              message: message,
              error: error
            }
          });
      }
      createPendingObject(hash, index, txs){
          let obj:any;

        if(this.data.action == "wrap"){
            obj ={
                hash: hash,
                nonce: EthUtils.bufferToInt(txs[index].nonce),
                from: this._account.account.address,
                to: this.data.to,
                value: this.data.amount,
                gas:EthUtils.bufferToInt(txs[index].gasLimit),
                gasPrice:parseInt(EthUtils.bufferToHex(txs[index].gasPrice)),
                input: EthUtils.bufferToHex(txs[index].data),
                timeStamp: Date.now()/1000
              }
        }else{
            obj ={
                hash: hash,
                nonce: EthUtils.bufferToInt(txs[index].nonce),
                from: this._account.account.address,
                to: this.data.to,
                value: 0,
                gas:EthUtils.bufferToInt(txs[index].gasLimit),
                gasPrice:parseInt(EthUtils.bufferToHex(txs[index].gasPrice)),
                input: EthUtils.bufferToHex(txs[index].data),
                timeStamp: Date.now()/1000
              }
        }
        
        console.log(obj);
        
        return obj
      }
      setErroParamsWhenNotConfiramtion(){
        this.title = "Unable to check transaction confirmation";
        this.message = "Something went wrong"
        this.error = "We can not check network confirmation, You can see the progress in the global tab";
      }
      
}