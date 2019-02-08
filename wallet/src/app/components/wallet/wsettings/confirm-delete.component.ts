import { Component, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';
import { ContractStorageService } from '../../../services/contractStorage.service';

@Component({
  selector: 'confirm-delete',
  templateUrl: './confirm-delete.component.html'
})
export class DeleteComponent{
  constructor(public dialog: MdDialog,public dialogRef: MdDialogRef<DeleteComponent>, private _account: AccountService, private _wallet: WalletService, private _contractStorage: ContractStorageService) {
   }

  deleteWallet(){
    this._wallet.delete(this._account.account.address);
    this._contractStorage.removeAccContracts(this._account.account.address)
    this._account.refreshAccount();

    this.dialogRef.close();

  }
  
  closeDialog(){
    this.dialogRef.close();
  }

}