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
        console.log("injected data?",this.data);
        
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
        
        this.dialogRef.close(JSON.stringify({status: "OK"}));
        /*
        let dataTx;
        let tx;
        let value = parseInt(this._web3.web3.toWei(data.amount, 'ether'));
        if(data.action == "wrap"){
            dataTx =  this._contract.getFunctionData(this._zeroEx.contract, "deposit");
            tx = await new RawTx(this._account, this._zeroEx.contract.address, new BigNumber(data.amount), data.gasLimit, data.gasPrice, this._web3.network, dataTx);
          }
          if(data.action == "unwrap"){
            let values = [];
            values.push(data.amount)
            console.log("unwrap value ",value);
            
            dataTx =  this._contract.getFunctionData(this._zeroEx.contract, "withdraw", values);
            let amount = 0;
            tx = await new RawTx(this._account, this._zeroEx.contract.address, new BigNumber(amount), data.gasLimit, data.gasPrice, this._web3.network, dataTx);
          }

        
            console.log("tx", tx);
            let txs  = [tx.tx];
      

          console.log("txs",txs);
          console.log("txs de 0",EthUtils.bufferToInt(txs[0].nonce));
        txs[0].nonce = await this.setTxNonce(this._account);

        for (let i = 0; i < txs.length; i++) {
            txs[i].sign(privateKey);
      
            let serialized = "0x"+(txs[i].serialize()).toString('hex');      
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
                    loadingDialog = this.dialog.open(LoadingDialogComponent, {
                        width: '660px',
                        height: '150px',
                        disableClose: true,
                      });
                  }
                  j++;
                }
                if(j==60){
                  //Create pending object
                  pending = this.createPendingObject(sendResult, i, txs);
                  this._account.addPendingTx(pending);
                  if(i==txs.length-1){
                    this.setErroParamsWhenNotConfiramtion();
                    loadingDialog.close();
                    let dialogRef2 = this.dialog.open(ErrorDialogComponent, {
                        width: '660px',
                        height: '210px',
                        data: {
                          title: this.title,
                          message: this.message,
                          error: this.error
                        }
                      });
                    dialogRef2.afterClosed().subscribe(result=>{
                        if(typeof(result)!= 'undefined' || result != ''){
                          this.router.navigate(['/wallet/history']);
                        }
                    })
                  }
                } else {
                  if(loadingDialog!=null){
                    loadingDialog.close();
                  }
                  pending.timeStamp = Date.now()/1000;
                  this._account.addPendingTx(pending);
                 
                  if(i==txs.length-1){
                    this.title = "Your transaction has been sent";
                    this.message = "You can see the progress in the global tab";
                    //self.dialogRef.close();
                    let dialogRef3 = this.dialog.open(ErrorDialogComponent, {
                        width: '660px',
                        height: '210px',
                        data: {
                          title: this.title,
                          message: this.message,
                          error: this.error
                        }
                      });
                    dialogRef3.afterClosed().subscribe(result=>{
                        if(typeof(result)!= 'undefined' || result != ''){
                          this.router.navigate(['/wallet/history']);
                        }
                    })
                  }
                }
              }
        }
        */
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