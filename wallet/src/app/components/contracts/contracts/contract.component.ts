import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidateAddress } from '../../../validators/address.validator'; 

import { ContractService } from '../../../services/contract.service'
import { FormsService } from '../../../services/forms.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-contract',
  templateUrl: './contract.component.html',
})
export class ContractPage implements OnInit{
  public contracts = [];
  public function = "";
  public functionForm: FormGroup;
  public inputs = [];
  public submited: boolean = false;
  public create = true;
  constructor(public _contract: ContractService, private _fb: FormBuilder, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService) {
    this.functionForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })
  }
  ngOnInit(){
    this.getContracts();
  }
  getContracts(){
    let contracts =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address);

    this.contracts = contracts;
    console.log(this.contracts)
  }
  async getFunction(){
    let contract = this.getControl('contract').value; 
  }

  getControl(controlName: string): AbstractControl{
    return this.functionForm.get(controlName);
  }

  async onSubmit(){
    this.submited = true;
    console.log(this.functionForm);
    if(this.functionForm.invalid){
      return false
    }
  }

}
