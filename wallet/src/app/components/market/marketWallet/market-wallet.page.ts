import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service'

@Component({
  selector: 'app-market-wallet',
  templateUrl: './market-wallet.page.html',
})
export class MarketWalletPage implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
}
