import { Component } from '@angular/core'

/*Services*/
//import { BitcoinWalletService } from '../../services/wallet-bitcoin.service'
//import { BitcoinAccountService } from '../../services/account-bitcoin.service'
import { DialogService } from '../../services/dialog.service'

/*Dialog*/
import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';
import { LoadingDialogComponent } from '../dialogs/loading-dialog.component';

import { Router } from '@angular/router';

const EthUtils = require('ethereumjs-util')

@Component({
  selector: 'BitcoinImportAccount-dialog',
  templateUrl: './BitcoinImportAccount-dialog.component.html'
})
export class BitcoinImportAccountDialogComponent{
  nameAccount:string;
  importType= "keystore";
  submited : boolean = false;

  constructor(public dialogRef: MdDialogRef<BitcoinImportAccountDialogComponent>,
               public dialog: MdDialog, private dialogService: DialogService,  private router: Router) {
/*
    if(_wallet.wallet == null ){
      this.nameAccount= "Account 1"
    }else{
      this.nameAccount = "Account "+(_wallet.wallet.length+1);
    }
    */
  }


  async importAccount(name, input, pass, pass2) {
    /*
    this.submited = true;
    let error:string = "";
    let dialog = this.dialog;
    let wallet = this._wallet;
    let account = this._account;
    let address;
    let importType = this.importType

    if(this.checkPass(pass, pass2) == false || this.checkInput(input) == false){
      return false
    }

    try{
      wallet.importAccountWIF(name, input, pass);


      account.getAccountData();


    }catch(e){
      error=(e.name=="SyntaxError")? "Json interface has wrong format": e.message;
    }
    let title = (error=="")? 'Your account has been successfully imported' : 'Unable to import account';
    let message = (error=="")? 'You can find it in the account list' : 'Something was wrong';
    let dialoRef = this.dialogService.openErrorDialog(title,message, error);
    this.dialogRef.close();
    this.dialogRef.afterClosed().subscribe(async result=>{
      this.router.navigate(['/btcwallet/btcglobal']);
    });
    */
  }

  checkPass(pass, pass2): boolean{
    if(pass != pass2){
      return false
    }

    return true
  }

  checkInput(input){
    if(input==null || input==""){
      return false
    }

    return true
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
