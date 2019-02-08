import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { BitcoinAccountService } from '../../../services/account-bitcoin.service';
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service';

import { MdSnackBar } from '@angular/material';
import * as QRcode from 'qrcode';

import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';

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
   
    if(this._account.account.balance == null){
      this.accountBalance = 0;
    }else{
      this.accountBalance = this._account.account.balance;
    }
    this.selectedAcc = this._account.account;

    this.interval2 = setInterval(() =>{   
      if(this.selectedAcc.address != 0){
        clearInterval(this.interval2);
      }
    }, 1000);
  }

  async ngOnInit() {
    
    try {
      await this._account.getAccountsBalances();  
    } catch (error) {
      this.err = "This service is not available";
      console.log(error); 
    }
    this.selectedAcc = this._account.account;
    await this._account.getAccountsBalances();
    
    
  }

  ngOnDestroy(){
    clearInterval(this.interval)
  }

}
