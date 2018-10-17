import { Component, OnInit } from '@angular/core';

/*Service*/
import { AccountService } from '../../../services/account.service';

/*Dialog*/
import { MdDialog } from '@angular/material';
import { DeleteComponent } from './confirm-delete.component';
import { JSONDialogComponent } from './json-dialog.component';
import { PrivateKeyDialogComponent } from './privatekey-dialog.component';
import { ErrorDialogComponent } from '../../dialogs/error-dialog.component';

import * as EthWallet from 'ethereumjs-wallet'
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'wsettings-page',
  templateUrl: './wsettings.html'
})
export class WsettingsPage implements OnInit {
  submited : boolean = false;
  show: boolean = false;
  
  message: string = "see password";

  constructor(private _account: AccountService, public dialog: MdDialog, private dialogService: DialogService) {
  }

  ngOnInit() {
    
  }
  exportPrivateKey(pass){
    this.submited = true;
    let error = "";
    let wallet;
    if(pass==null || pass==""){
      return;
    }
    try{
      wallet = EthWallet.fromV3(this._account.account.v3, pass);
    }catch(e){
      error= e.message;
    }
    if(error==""){
      let dialogRef = this.dialog.open( PrivateKeyDialogComponent, {
        width: '660px',
        height: '225px',
        data : {
          private: wallet.getPrivateKeyString(),
        }
      });
    }else{
      let title = 'Unable to export account';
      let message = 'Something was wrong';
      let dialogRef = this.dialogService.openErrorDialog(title, message, error);   
    }   
  }

  exportAccount(pass){
    this.submited = true;
    let wallet: any;
    let v3
    let fileName: string;
    if(pass==null || pass==""){
      return;
    }
    
    let error:string = "";

    try{ 
      wallet = EthWallet.fromV3(this._account.account.v3, pass);
      v3 = this._account.account.v3;
      fileName = wallet.getV3Filename();
    }catch(e){
      error = e.message;
    }

    if(error!=""){
      let dialogRef = this.dialog.open(ErrorDialogComponent, {
        width: '660px',
        height: '180px',
        data: {
          title: 'Unable to export account',
          message: 'Something was wrong',
          error: error,
        }
      }); 

    }else{
 
      let dialogRef = this.dialog.open( JSONDialogComponent, {
        width: '660px',
        height: '310px',
        data : {
          v3: v3,
          fileName : fileName
        }
      });
    } 
  }

  deleteAccount(){
    let dialogRef = this.dialog.open(DeleteComponent, {
      width: '660px',
      height: '230px',
    });
  }

  showPassword(){
    this.show = !this.show;
    this.message = (this.show == false)? "see password" : "hide password";

    let pass:any = document.getElementById("password");

    pass.type = (this.show == true) ? "text" :"password";
    
  }
  
}
