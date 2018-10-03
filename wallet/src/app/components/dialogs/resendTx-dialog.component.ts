import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { Web3 } from '../../services/web3.service';
import { Transaction } from '../../models/transaction'
import { RawTxService } from '../../services/rawtx.sesrvice';
import { SendDialogComponent } from '../dialogs/send-dialog.component';


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

    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<ResendTxDialogComponent>, private _web3: Web3, private _rawTx: RawTxService, private dialog: MdDialog){
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
        console.log('close')
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
        gasPrice = this._web3.web3.toWei(this._web3.web3.fromWei(gasPrice, 'Gwei').toFixed(1), "Gwei");
        this.cancelTx.gasPrice = gasPrice*2;
        this.newTx.gasPrice = gasPrice*2;
    }

    async sendTx(){
        let options: any = {
            gasLimit: this.tx.gas,
            gasPrice: this.tx.gasPrice,
            nonce: this.tx.nonce
        }

        if(this.tx.input != "0x") {
            options.data = this.tx.input;
        }
        let rawTx = await this._rawTx.createRaw(this.tx.to, this._web3.web3.fromWei(this.tx.value,'ether'),options);
        this.dialogRef.close();
        this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: rawTx[0],
                to: this.tx.to,
                amount: rawTx[2],
                fees:  rawTx[1]- rawTx[2],
                total:  rawTx[1],
                action: 'send',

            }
        });
    }
}