import { Component, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

import { BitcoinAccountService } from '../../../services/account-bitcoin.service';
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service'

@Component({
  selector: 'btc-confirm-delete',
  templateUrl: './btc-confirm-delete.component.html'
})
export class BitcoinDeleteComponent{
  constructor(public dialog: MdDialog,public dialogRef: MdDialogRef<BitcoinDeleteComponent>, private _account: BitcoinAccountService, private _wallet: BitcoinWalletService) {
    
   }

  deleteWallet(){
    this._wallet.delete(this._account.account.address);
    this._account.refreshAccount();
    
    this.dialogRef.close();

  }
  
  closeDialog(){
    this.dialogRef.close();
  }
}