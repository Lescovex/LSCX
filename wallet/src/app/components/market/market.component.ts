import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../services/account.service'

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
})
export class MarketComponent implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }
}
