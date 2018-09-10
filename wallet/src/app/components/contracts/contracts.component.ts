import { Component, DoCheck} from '@angular/core'

import { AccountService } from '../../services/account.service'
import { LCXContractService } from '../../services/LCX-contract.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { Web3 } from '../../services/web3.service';

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html'
})
export class ContractsComponent implements DoCheck{
  contracts=[];
  selected = false;
  constructor(public _account:AccountService, private _LCXcontract: LCXContractService, private _contractStorage: ContractStorageService, private _web3: Web3) {
    this.getContracts();
  }
  ngDoCheck(){
    if(Object.keys(this._LCXcontract.contractInfo).length > 0){
      this.selected = true
    }else{
      this.selected = false
    }
  }

  maxHeight(){
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
  
  getContracts(){
    let contracts =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network);
    this.contracts = contracts;
  }
}
