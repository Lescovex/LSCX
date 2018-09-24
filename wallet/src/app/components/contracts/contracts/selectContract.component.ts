import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl,Validators} from '@angular/forms';

import { LSCXContractService } from '../../../services/LSCX-contract.service'
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
  public moreInfo = [];
  public functions = [];
  
  constructor(public _LSCXcontract: LSCXContractService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService, private router : Router, private _web3: Web3) {
    this._contractStorage.checkForAddress();
    if(this._contractStorage.LSCX_Contracts.length == 0 && this._contractStorage.customContracts.length == 0 ){
      this.router.navigate(['/contracts/add'])
    }
    this.contractForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })

    if(Object.keys(this._LSCXcontract.contractInfo).length > 0){
      this.selected = true
    }
  }

  ngOnInit(){
  }
  
  async setContract(contract){
    if(!contract.active){
      return false
    }
    let dialofRef = this._dialog.openLoadingDialog();

    await this._LSCXcontract.setContract(contract);
    this._LSCXcontract.functions =  this._LSCXcontract.getFunctions();
    dialofRef.close();
    this.selected = true;
  }
  
  deleteContract(contract){
    let dialogRef = this._dialog.openDeleteDialog('contract');
    dialogRef.afterClosed().subscribe(result=> {
      if (result){
        this._contractStorage.deletContract(contract);
        this._account.deleteToken(contract.address);
      }
    })
  }
  onBack(bool: boolean){
    if(bool){
      this.selected= false;
      this._LSCXcontract.reset();
    }
  }
}
