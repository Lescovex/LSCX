import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import { Web3 } from '../../services/web3.service';
import { AccountService } from "../../services/account.service";
import { ZeroExService } from "../../services/0x.service";
import { DialogService } from '../../services/dialog.service';

@Component({
    selector: 'wrap-unwrap',
    templateUrl: './wrap-unwrap.component.html'
})

export class WrapUnwrapDialogComponent implements OnInit{
    submited = false;
    display = "wrap";
    amount;
    sendDialog;
    constructor(public dialogService: DialogService, public dialogRef: MdDialogRef<WrapUnwrapDialogComponent>, private _web3: Web3, protected _account: AccountService, protected _zeroEx : ZeroExService){
    }
    ngOnInit(){

    }
    closeDialog(){
        this.dialogRef.close();
    }

    wrap(form){
        this.submited = true;
        if(form.invalid){
            return false;
        }else{
            this.sendTx(form.controls.amount.value, "wrap")
        }
    }

    unwrap(form){
        this.submited = true;
        if(form.invalid){
            return false;
        }else{
            this.sendTx(form.controls.amount.value, "unwrap")
        }
    }
    sendTx(amount, action){
        this.dialogRef.close(JSON.stringify({amount: amount, action:action}));       
    }
}