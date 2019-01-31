import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { Web3 } from '../../services/web3.service';

import { AccountService } from '../../services/account.service';
import { Transaction } from '../../models/transaction'
import { SendDialogComponent } from './send-dialog.component';

import { ResendTx } from '../../models/rawtx';
import BigNumber from 'bignumber.js';


@Component({
    selector: 'resend-tx',
    templateUrl: './resendTx-dialog.component.html'
})

export class ResendTxDialogComponent implements OnInit{
    submited = false;
    tx: Transaction;
    newTx: Transaction;
    cancelTx: Transaction;
    action:String;

    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<ResendTxDialogComponent>, private _web3: Web3, protected dialog: MdDialog, protected _account: AccountService){
        this.newTx = new Transaction(this.data);
        
        this.setCancelTx();
        this.setGasPrice();
        this.setAction('resend');
    }

    ngOnInit(){

    }

    setAction(action){
        this.action=action
        switch (this.action) {
            case "cancel":
                this.tx = this.cancelTx;
                break;
            case "resend":
                this.tx = this.newTx;
                break;
        }
    }

    closeDialog(){
        this.dialogRef.close();
    }

    setCancelTx(){
        this.cancelTx= new Transaction (this.data);
        this.cancelTx.to = this.data.from;
        this.cancelTx.value = 0;
        this.cancelTx.input = "0x";
    }
    async setGasPrice(){
        let gasPrice = await this._web3.getGasPrice();
        
        gasPrice = parseInt(this._web3.web3.toWei(parseFloat(this._web3.web3.fromWei(gasPrice, 'Gwei')).toFixed(1), "Gwei"));
        
        if(gasPrice <= parseInt(this.data.gasPrice)){
            gasPrice = this.data.gasPrice;
        }
        
        this.cancelTx.gasPrice = gasPrice*2;
        this.newTx.gasPrice = gasPrice*2;
    }

    async sendTx(){
 
        let data = "";
        if(this.tx.input != "0x") {
           data  = this.tx.input;
        }
       
        let rawTx = new ResendTx(this._account, this.tx.to, new BigNumber(this.tx.value),this.tx.gas, this.tx.gasPrice,this._web3.network, data, this.tx.nonce)
        this.dialogRef.close();
        this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: rawTx.tx,
                to: this.tx.to,
                amount: this.tx.value,
                fees:  rawTx.gas,
                total:  rawTx.cost,
                action: 'send',

            }
        });
    }
}