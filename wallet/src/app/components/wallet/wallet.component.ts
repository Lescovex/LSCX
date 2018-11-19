import { Component, OnInit, OnDestroy } from '@angular/core'

import { AccountService } from '../../services/account.service'
import { Web3 } from '../../services/web3.service';
@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit, OnDestroy {

  constructor(public _account:AccountService, protected _web3: Web3) {
    
  }

  ngOnInit() {
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
  
  ngOnDestroy(){
    this._account.clearIntervalTokens();
  }
}
