import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../services/account.service'
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html'
})
export class ContractsComponent implements OnInit {

  constructor(public _account:AccountService, private _contract: ContractService) {
  }
  ngOnInit() {
  }
  
  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
}
