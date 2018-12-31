import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

//import { HomeComponent } from '../../home/home.component';
import { BitcoinAccountService } from '../../../services/account-bitcoin.service';
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service';
//import { PylonQRDialogComponent } from './PylonQR-dialog.component';
import { MdSnackBar } from '@angular/material';
import * as QRcode from 'qrcode';

import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';

//var blockies = require("../../../../../config/blockies")

@Component({
  selector: 'btcglobal-page',
  templateUrl: './btcglobal.html',
  providers: [MdSnackBar]
})
export class BitcoinGlobalPage implements OnInit {
  public interval;
  public token :any;
  public selectedAcc;
  public tokenBalance;
  public interval2;
  
  public accountBalance;
  public address;
  public shaAddr;
  protected wif;

  public loadingD;
  err;
  constructor(public snackBar: MdSnackBar, protected router: Router, protected _account : BitcoinAccountService, public dialog: MdDialog) {
    
    /*
    Promise.resolve().then(() => { 
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    });
*/
    //this.home.ngOnInit();
    
    if(this._account.account.balance == null){
      this.accountBalance = 0;
    }else{
      this.accountBalance = this._account.account.balance;
    }
    this.selectedAcc = this._account.account;

    this.interval2 = setInterval(() =>{   
      if(this.selectedAcc.address != 0){
        clearInterval(this.interval2);
        //this.createIcon(this.selectedAcc.address);
        
      }
    }, 1000);

    
  }

  async ngOnInit() {
    //console.log("account history?",this._account.account.history);
    try {
      await this._account.getAccountsBalances();  
    } catch (error) {
      this.err = "This service is not available";
      console.log(error); 
    }
    this.selectedAcc = this._account.account;
    await this._account.getAccountsBalances();
    //console.log("account history?",this._account.account.history);
    
  }

  ngOnDestroy(){
    clearInterval(this.interval)
  }

  copyClipBoard(){
    var inp =document.createElement('input');
    document.body.appendChild(inp)
    inp.value = this._account.account.address;
    inp.select();
    document.execCommand('copy',false);
    inp.remove()
    this.openSnackBar();
  }
 
  openSnackBar() {
    this.snackBar.open("Your address " +this._account.account.address + " has been copied to the clipboard.", "Close", {
      duration: 2000,
    });
  }

  send(){
    this.router.navigate(['/home/pylon-wallet/psend']); 
  }

  /*
  openQR(){
    let dialogRef = this.dialog.open(PylonQRDialogComponent, {
      width: '660px',
      height: '',
      panelClass: 'dialog'
    });
  }
  */
/*
  createIcon(addr){
    
    var icon = blockies.create({ // All options are optional
      seed: addr, // seed used to generate icon data, default: random
      color: '#20b2aa', // to manually specify the icon color, default: random
      bgcolor: '#1a5171', // choose a different background color, default: random
      size: 15, // width/height of the icon in blocks, default: 8
      scale: 4, // width/height of each block in pixels, default: 4
      spotcolor: '#FFF' // each pixel has a 13% chance of being of a third color,
      // default: random. Set to -1 to disable it. These "spots" create structures
      // that look like eyes, mouths and noses.
  });

    document.getElementById(addr).appendChild(icon);
    //this.loadingD.close();
  }
  */
}
