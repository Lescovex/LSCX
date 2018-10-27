import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import {MdDialog} from '@angular/material';

import { LoadingDialogComponent } from './components/dialogs/loading-dialog.component';
import { Web3 } from './services/web3.service';
import { AccountService } from './services/account.service';
import { EtherscanService } from './services/etherscan.service';
import { ContractStorageService } from './services/contractStorage.service';
import { LSCXMarketService } from './services/LSCX-market.service';

@Component({
  selector: 'ion-app',
  templateUrl: './app.html',
})
export class MyApp implements OnInit {
  loadingD;
  interval;
  
  constructor(protected _account: AccountService, protected dialog: MdDialog, protected _web3: Web3, protected router : Router, protected _scan: EtherscanService, private _contracStorage: ContractStorageService, private _LSCXmarket: LSCXMarketService) {
    if(this._scan.apikey==""){
      this.router.navigate(['/general-settings']);
    }else{
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    }  
  }
  async ngOnInit() {
    this._contracStorage.checkForAddress();
    if(this._scan.apikey!=""){
      this.interval = setInterval(async() => {
        if('address'in this._account.account){
          if('balance' in this._account.account && this._LSCXmarket.updated){
            this.loadingD.close();
            clearInterval(this.interval);
          }
        }else{
          if(this._LSCXmarket.updated){
            clearInterval(this.interval);
          this.loadingD.close();
          } 
        } 
      });
    }
  }

  
}
