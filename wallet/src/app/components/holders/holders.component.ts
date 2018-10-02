import { Component, OnInit } from '@angular/core';

import { AccountService } from '../../services/account.service';
import { Web3 } from '../../services/web3.service';

@Component({
  selector: 'app-holders',
  templateUrl: './holders.component.html',
})
export class HoldersComponent implements OnInit {

  constructor(public _account:AccountService,  protected _web3: Web3) {
  }
  ngOnInit() {
  }
}
