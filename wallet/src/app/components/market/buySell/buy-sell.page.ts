import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service'

@Component({
  selector: 'app-buy-sell',
  templateUrl: './buy-sell.page.html',
})
export class BuySellPage implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
}
