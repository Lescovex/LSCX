import { Component } from '@angular/core'

/*Services*/
import { BitcoinWalletService } from '../../services/wallet-bitcoin.service'
import { BitcoinAccountService } from '../../services/account-bitcoin.service'
import { DialogService } from '../../services/dialog.service'

/*Dialog*/
import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';

import { Router } from '@angular/router';



@Component({
  selector: 'BitcoinNewAccount-dialog',
  templateUrl: './BitcoinNewAccount-dialog.component.html'
})

export class BitcoinNewAccountDialogComponent {
  nameAccount:string;
  constructor(public dialogRef: MdDialogRef<BitcoinNewAccountDialogComponent>, private _wallet: BitcoinWalletService,
              private _account: BitcoinAccountService, public dialog: MdDialog,private dialogService: DialogService, private router: Router) {
      
    if(this._wallet.wallet == null ){
      this.nameAccount= "Account 1"
    }else{
      this.nameAccount = "Account "+(this._wallet.wallet.length+1);
    }
  }


  createAccount(name, pass, pass2){
    let error:string = "";

    if(this.checkPass(pass, pass2) == false){
      
      return false
    }
    try{
      this._wallet.newAccount(name, pass);
      
      this._account.getAccountData();
      
      
    }catch(e){
      error= e.message;
    }
    let title = (error=="")? 'Your account has been successfully created' : 'Unable to create account';
    let message = (error=="")? 'You can find it in the wallet list' : 'Something was wrong';

    let dialogRef = this.dialogService.openErrorDialog(title, message, error);
    
    this.dialogRef.close();
    dialogRef.afterClosed().subscribe(async result=>{
      this.router.navigate(['/btcwallet/btcglobal']);
    });
  }
  
  checkPass(pass, pass2){
    if(pass != pass2){
      document.getElementById('pass2').className += " error";
      return false
    } 
    return true
  }

  closeDialog(){
    this.dialogRef.close();
  }


}
