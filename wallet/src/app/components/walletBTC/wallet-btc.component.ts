import { Component, OnInit, OnDestroy } from '@angular/core'

import { BitcoinAccountService } from '../../services/account-bitcoin.service';
import { Web3 } from '../../services/web3.service';
@Component({
  selector: 'bitcoin-app-wallet',
  templateUrl: './wallet-btc.component.html',
})
export class BitcoinWalletComponent implements OnInit, OnDestroy {

  constructor(public _account:BitcoinAccountService) {
    
  }

  ngOnInit() {
    //this._account.checkServer();
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
  
  ngOnDestroy(){
   
  }
}
