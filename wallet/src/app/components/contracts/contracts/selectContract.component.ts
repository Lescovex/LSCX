import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl,Validators} from '@angular/forms';

import { ContractService } from '../../../services/contract.service'
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';
import { Router } from '@angular/router';
import { Web3 } from '../../../services/web3.service';

@Component({
  selector: 'app-select-contract',
  templateUrl: './selectContract.component.html',
})
export class SelectContractPage implements OnInit{
  public selected: boolean = false;
  public contracts = [];
  public contractForm: FormGroup;
  public contractInfo;
  public moreInfo = [];
  public functions = [];

  
  
  constructor(public _contract: ContractService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService, private router : Router, private _web3: Web3) {
    this.getContracts();
    this._contractStorage.checkForAddress();
    if(this.contracts.length == 0){
      this.router.navigate(['/contracts/add'])
    }
    this.contractForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })    
  }

  ngOnInit(){
    this.getContracts();
  }

  getContracts(){
    let contracts =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network);
    this.contracts = contracts;
  }
  
  async setContract(contract){
    if(!contract.active){
      return false
    }
    let dialofRef = this._dialog.openLoadingDialog();

    await this._contract.setContract(contract);
    let txfunctions = this._contract.getTransFunctions();
    let callFunctions = this._contract.getInfoFunctions();
    this.functions =  txfunctions.concat(callFunctions)
    console.log("functions",this.functions)
    this.moreInfo = await this._contract.getContractData();
    dialofRef.close();
    this.selected = true;
  }
  
  onBack(bool: boolean){
    if(bool){
      this.selected= false;
      this._contract.reset();
    }

  }

}
