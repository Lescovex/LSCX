import { Component } from '@angular/core';
import { Router } from '@angular/router';

/*Services*/
import { WalletService } from '../../services/wallet.service'
import { AccountService } from '../../services/account.service'
import { DialogService } from '../../services/dialog.service'
import { ZeroExService } from "../../services/0x.service";

/*Dialog*/
import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';

const EthUtils = require('ethereumjs-util')

@Component({
  selector: 'importAccount-dialog',
  templateUrl: './importAccount-dialog.component.html'
})
export class ImportAccountDialogComponent{
  nameAccount:string;
  importType= "keystore";
  submited : boolean = false;

  passErr;
  pass2Err;
  checkPassErr;

  protected input;
  protected password;
  protected password2;

  constructor(protected router : Router, public dialogRef: MdDialogRef<ImportAccountDialogComponent>, private _wallet: WalletService,
               private _account: AccountService, public dialog: MdDialog, private dialogService: DialogService, public _zeroEx : ZeroExService) {

    if(_wallet.wallet == null ){
      this.nameAccount= "Account 1"
    }else{
      this.nameAccount = "Account "+(_wallet.wallet.length+1);
    }
  }

 
  async importAccount(name, input, pass, pass2) {
    this.submited = true;
    let error:string = "";
    let dialog = this.dialog;
    let wallet = this._wallet;
    let account = this._account;
    let address;
    let importType = this.importType
    
    
    if(this.checkPass(pass, pass2) == false || this.checkInput(input) == false){
      if(this.checkPass(pass, pass2) == false){
        this.checkPassErr = true;
      }else{
        this.checkPassErr = null;
      }
   
      return false
    }

    if(pass==null || pass2 == null){
      if(pass == null){
        this.passErr = true;
      }else{
        this.passErr = null;
      }
      if(pass2 == null){
        this.pass2Err = true;
      }else{
        this.pass2Err = null;
      }
  
      return false;
    }
    if(this.importType=="keystore"){
      try{
        address = '0x'+JSON.parse(input).address;
      }catch(e){
        error=(e.name=="SyntaxError")? "Json interface has wrong format": e.message;
      }
    }else{
      input=(input.startsWith('0x')||input.startsWith('0X'))? input : '0x'+input;
      try{
        address= (EthUtils.privateToAddress(input)).toString('hex');
      }catch(e){
        error=e.message;
      }

    }
    
    
    this.dialogRef.close();
    let loadingD = this.dialogService.openLoadingDialog();
    if(error!="" || this._wallet.wallet != null && typeof(this._wallet.getAccount(address))!== 'undefined'){
      let title = 'Unable to import account';
      let message = 'Something was wrong';
      error = (error!="")? error : 'The account you are are trying to import is a duplicate'
      let dialoRef = this.dialogService.openErrorDialog(title,message, error);
      
      return false
    }

    
    try{
      if(importType=="keystore"){
        wallet.importAccountJSON(name, input, pass);
        if(!localStorage.getItem('acc')){
          this.router.navigate(['/wallet/global']);
        } 
      }else{
        wallet.importAccountPrivate(name, input, pass);
        if(!localStorage.getItem('acc')){
          this.router.navigate(['/wallet/global']);
        } 
      }
      if(!localStorage.getItem('acc')){
        account.getAccountData();
        await this._zeroEx.init();
      } 
      
    }catch(e){
      error=(e.name=="SyntaxError")? "Json interface has wrong format": e.message;
    }
    let title = (error=="")? 'Your account has been successfully imported' : 'Unable to import account';
    let message = (error=="")? 'You can find it in the account list' : 'Something was wrong';
    loadingD.close()
    let dialoRef = this.dialogService.openErrorDialog(title,message, error);

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
