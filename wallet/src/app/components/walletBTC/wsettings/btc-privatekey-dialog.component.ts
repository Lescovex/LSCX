import { Component, Inject  } from '@angular/core'

import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';

import { BitcoinAccountService } from '../../../services/account-bitcoin.service';
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service'



@Component({
  selector: 'btc-privatekey-dialog',
  templateUrl: './btc-privatekey-dialog.component.html'
})
export class BitcoinPrivateKeyDialogComponent{
  constructor(@Inject(MD_DIALOG_DATA) public data: any ,public dialogRef: MdDialogRef<BitcoinPrivateKeyDialogComponent>, private _account: BitcoinAccountService,
   private _wallet: BitcoinWalletService, public dialog: MdDialog) {
     
     
   }

  
  closeDialog(){
    this.dialogRef.close();
  }

}