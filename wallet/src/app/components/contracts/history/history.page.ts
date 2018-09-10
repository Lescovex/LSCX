import { Component, OnInit } from '@angular/core'
declare var require: any;

import { AccountService } from '../../../services/account.service';
import { LCXContractService } from '../../../services/LCX-contract.service';


@Component({
  selector: 'history-page',
  templateUrl: './history.html'
})
export class HistoryPage implements OnInit {
  constructor(protected _account: AccountService, private _LCXcontract: LCXContractService) {
  }
  ngOnInit() {
  }


}
