import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
/*Service*/
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service';
import { BitcoinAccountService } from '../../../services/account-bitcoin.service'

/*Dialog*/
import { MdDialog } from '@angular/material';
import { BitcoinDeleteComponent } from './btc-confirm-delete.component';
import { BitcoinJSONDialogComponent } from './btc-json-dialog.component';
import { BitcoinPrivateKeyDialogComponent } from './btc-privatekey-dialog.component';
import { ErrorDialogComponent } from '../../dialogs/error-dialog.component';
import { BitcoinChangeNameComponent } from './btcchange-name.component';

import * as EthWallet from 'ethereumjs-wallet';
var CryptoJS = require("crypto-js");
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'btcwsettings-page',
  templateUrl: './btcwsettings.html'
})
export class BitcoinWsettingsPage implements OnInit {
  submited : boolean = false;
  show: boolean = false;
  message: string = "see password";
  protected password;

  protected senderAddr;
  protected selectedAcc;
  protected interval;
  protected name;
   
  changeName;
  err;

  constructor(private router: Router, protected _account: BitcoinAccountService, protected _wallet : BitcoinWalletService, public dialog: MdDialog, private dialogService: DialogService) {
    
    this.name = this._account.account.name;
    this.selectedAcc = this._account.account;
  }

  async ngOnInit() {
    try {
      await this._account.getAccountsBalances();  
    } catch (error) {
      this.err = "This service is not available";
      console.log(error);
      
    }
    this.name = this._account.account.name;
    this.senderAddr = this._account.account.address;  
  }

  changeAccountName(){
    this.submited = true;
    let error = "";
    let wallet;
    
    if(this.password == null || this.password == ""){
      return false;
    }
    this.changeName = this.dialog.open(BitcoinChangeNameComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });

    this.changeName.afterClosed().subscribe(async result=>{
      if(result == "change"){

        let storage = JSON.parse(localStorage.getItem('btcAcc'));
        let acca = new Array();
        for (let index = 0; index < storage.length; index++) {
          if(this._account.account.address == storage[index].address){
              storage[index].name = this.name;
              acca.push(storage[index]);
          }else{
            acca.push(storage[index]);
          }
    
        }
        localStorage.removeItem('btcAcc');
        localStorage.setItem("btcAcc", JSON.stringify(storage));
        this._wallet.getFinishW();
        this._account.getAccountData();
        this.router.navigate(['/btcwallet/btcglobal']);
      } else {
        return false;
      }     
    });
  }

  exportWIF(pass){
    this.submited = true;
    let error = "";
    let wallet;
    
    if(pass==null || pass==""){
      return;
    }

    try{
      let wall = JSON.parse(localStorage.getItem('btcAcc'));
      let acc = wall.find(x => (x.address).toLowerCase() === this._account.account.address.toLowerCase());
      
      let item = acc.wif;
      var bytes2  = CryptoJS.AES.decrypt(item.toString(),pass);
      var wif = bytes2.toString(CryptoJS.enc.Utf8);

      wallet = wif;
      
    }catch(e){
      error= e.message;
    }
    if(error==""){
      let dialogRef = this.dialog.open( BitcoinPrivateKeyDialogComponent, {
        width: '660px',
        height: '225px',
        data : {
          private: wallet
        }
      });
    }else{
      let title = 'Unable to export account';
      let message = 'Something was wrong';
      let dialogRef = this.dialogService.openErrorDialog(title, message, error);   
    }   
  }



  deleteAccount(){
    let dialogRef = this.dialog.open(BitcoinDeleteComponent, {
      width: '660px',
      height: '230px',
    });
    dialogRef.afterClosed().subscribe(async result=>{
      this.router.navigate(['/btcwallet/btcglobal']);
    })
  }

  showPassword(){
    this.show = !this.show;
    this.message = (this.show == false)? "see password" : "hide password";

    let pass:any = document.getElementById("password");

    pass.type = (this.show == true) ? "text" :"password";
    
  }

}
