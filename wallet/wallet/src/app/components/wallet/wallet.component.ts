import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../account.service'

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }
}
