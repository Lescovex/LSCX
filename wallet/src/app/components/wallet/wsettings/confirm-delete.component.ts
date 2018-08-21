import { Component, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';

@Component({
  selector: 'confirm-delete',
  templateUrl: './confirm-delete.component.html'
})
export class DeleteComponent{
  constructor(public dialog: MdDialog,public dialogRef: MdDialogRef<DeleteComponent>, private _account: AccountService, private _wallet: WalletService) {
   }

  deleteWallet(){
    this._wallet.delete(this._account.account.address);
    this._account.refreshAccount();
    //open dialog
    this.dialogRef.close();

  }
  
  closeDialog(){
    this.dialogRef.close();
  }

}