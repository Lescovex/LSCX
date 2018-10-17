import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../services/account.service'
import { Web3 } from '../../services/web3.service';
@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit {

  constructor(public _account:AccountService, protected _web3: Web3) {
    console.log("NETWORK?????",this._web3.network.chain);
  }

  ngOnInit() {
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
  

  checkNetwork(){
    console.log("NETWORK?????",this._web3.network.chain);
    
  }
}
