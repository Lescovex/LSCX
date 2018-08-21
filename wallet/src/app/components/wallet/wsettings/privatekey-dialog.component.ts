import { Component, Inject  } from '@angular/core'

import { MdDialog } from '@angular/material';
import {MdDialogRef} from '@angular/material';
import {MD_DIALOG_DATA} from '@angular/material';

import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';



@Component({
  selector: 'privatekey-dialog',
  templateUrl: './privatekey-dialog.component.html'
})
export class PrivateKeyDialogComponent{
  constructor(@Inject(MD_DIALOG_DATA) public data: any ,public dialogRef: MdDialogRef<PrivateKeyDialogComponent>, private _account: AccountService,
   private _wallet: WalletService, public dialog: MdDialog) {
     
   }

  
  closeDialog(){
    this.dialogRef.close();
  }

}