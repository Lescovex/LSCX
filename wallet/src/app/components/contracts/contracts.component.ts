import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../services/account.service'

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
})
export class ContractsComponent implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }
}
