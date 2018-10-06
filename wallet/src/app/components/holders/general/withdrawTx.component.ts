import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { AccountService } from '../../../services/account.service';
import { DialogService } from '../../../services/dialog.service';

import { Web3 } from '../../../services/web3.service';
import { userInfo } from 'os';

@Component({
    selector: 'withdraw-tx',
    templateUrl: './withdrawTx.component.html'
})

export class WithdrawTxDialog{
    public pass;
    insufficient = false;
    submited;
    
    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogService: DialogService,  protected _account: AccountService, private _web3: Web3, private dialogRef: MdDialogRef<WithdrawTxDialog>){
        
        if(_web3.web3.toWei(this._account.account.balance,'ether') < data.cost ){
            this.insufficient= true;
        }
    }
   
    confirm(form){
        let self = this;
        let error = "";
        let title = "";
        let message = "";
    
        this.submited = true;
        if(form.invalid){
            return false;
        }
        let privateKey;
        try{
          privateKey = this._account.getPrivateKey(this.pass)
        }catch(e){
          title = "Unable to complete transaction";
          message = "Something went wrong";
          error = e.message;
          self.dialogRef.close();
          let dialogRef = self.dialogService.openErrorDialog(title,message,error);
          return false
        }

        this.dialogRef.close(JSON.stringify({pass: this.pass,}));
    }
    closeDialog(){
        this.dialogRef.close();
    }

}