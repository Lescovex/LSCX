import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl,Validators} from '@angular/forms';

import { LSCXContractService } from '../../../services/LSCX-contract.service'
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';
import { Router } from '@angular/router';
import { Web3 } from '../../../services/web3.service';
import { CustomContractService } from '../../../services/custom-contract.service';
import { ContractService } from '../../../services/contract.service';

@Component({
  selector: 'app-select-contract',
  templateUrl: './selectContract.component.html',
})
export class SelectContractPage implements OnInit{
  public selected: boolean = false;
  public contractSelected = "";
  public contracts = [];
  public contractForm: FormGroup;
  public moreInfo = [];
  public functions = [];
  public selectedContract:string;

  constructor(public _LSCXcontract: LSCXContractService, protected _customContract: CustomContractService, protected _contract: ContractService, protected _account: AccountService, protected _contractStorage: ContractStorageService, protected _dialog: DialogService, private router : Router, private _web3: Web3) {
    this._contractStorage.checkForAddress();
    
    if(this._contractStorage.LSCX_Contracts.length == 0 && this._contractStorage.customContracts.length == 0 ){
      this.router.navigate(['/contracts/add']);
      
    }
    this.contractForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })

    if(Object.keys(this._LSCXcontract.contractInfo).length > 0){
      this.selected = true;
      this.selectedContract = "LSCX";
    }
    if(Object.keys(this._customContract.contractInfo).length > 0){
      this.selected = true;
      this.selectedContract = "custom";
    }
  }

  ngOnInit(){
    
  }
  
  async setContract(contract){
    console.log("contract",contract)
    if(contract.type !="custom" && !contract.active){
      return false
    }
    let dialogRef = this._dialog.openLoadingDialog();
    if(contract.type =="custom"){
      await this._customContract.setContract(JSON.parse(contract.abi), contract);
      this._customContract.getFunctions();
      this.selectedContract = "custom";
    }else{
      await this._LSCXcontract.setContract(contract);
      this._LSCXcontract.functions =  this._LSCXcontract.getFunctions();
      this.selectedContract = "LSCX";
    }
    dialogRef .close();
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
      this._customContract.reset();
    }
  }
}
