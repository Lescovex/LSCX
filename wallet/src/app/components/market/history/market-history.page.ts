import { Component, OnInit } from '@angular/core'
declare var require: any;

import { AccountService } from '../../../services/account.service';
import { ContractService } from '../../../services/contract.service';


@Component({
  selector: 'market-history-page',
  templateUrl: './market-history.page.html'
})
export class MarketHistoryPage implements OnInit {
  constructor(protected _account: AccountService, private _contract: ContractService) {
  }
  ngOnInit() {
  }


}
