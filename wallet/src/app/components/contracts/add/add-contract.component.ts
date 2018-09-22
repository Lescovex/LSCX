import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidateAddress } from '../../../validators/address-validator.directive'; 

import { LSCXContractService } from '../../../services/LSCX-contract.service'
import { FormsService } from '../../../services/forms.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Contract } from '../../../models/contract';
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { ContractDialogComponent } from './contract-dialog.component';
import {MdDialog} from '@angular/material';

@Component({
  selector: 'app-add-contract',
  templateUrl: './add-contract.component.html',
})

export class AddContractPage {
  public contract = null;
  public abi;
  public constructorForm: FormGroup;
  public inputs = [];
  public submited: boolean = false;
  public create = true;
  public zero = "0";
  public contracts=['Asset-Backed Tokens (ABT)', 'Crypto Currencies (CYC)', 'Income Smart Contract (ISC)', 'Crypto Investment Fund (CIF)'];

  constructor(public _LSCXcontract: LSCXContractService, private _fb: FormBuilder, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService, private router: Router, private _web3: Web3, public dialog: MdDialog) {
    this.constructorForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })
  }

  
  async getConstructor(){
    
    let contract = this.getControl('contract').value

    if(contract != this.contract){
      this.submited = false;
      let inputs = [];
      //Remove prev controls
      if(this.contract != null){
        //console.log("dentro remove");
        inputs = this._LSCXcontract.getConstructor(this.abi);
        this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);
      }
      
      this.contract = contract;
      //console.log("get abi");
      this.abi = await this._LSCXcontract.getAbi(contract);
      
      inputs = this._LSCXcontract.getConstructor(this.abi);
      inputs = this._LSCXcontract.addDecimalsConst(inputs, contract)
      this.constructorForm = this._forms.addControls(inputs, this.constructorForm);
      this.inputs=inputs;
    }

      
  }

  getControl(controlName: string): AbstractControl{
    return this.constructorForm.get(controlName);
  }

  async createSubmit(){
    this.submited = true;

    if(this.constructorForm.invalid){
      return false
    }
    let dialogRef = this._dialog.openLoadingDialog();
    let type = this.getControl('contract').value;
    let byteCode = await this._LSCXcontract.getBytecode(type);
    let args = this._forms.getValues(this.inputs, this.constructorForm, type);

    let data = await this._LSCXcontract.getDeployContractData(type, byteCode, args);
    let gasLimit;
    try {
      gasLimit = await this._web3.estimateGas(this._account.account.address, "", data, 0);
      console.log("gaslimit?", gasLimit);
      
    }catch(e){
      gasLimit = 3500000;
    }

    dialogRef.close();
    dialogRef = this._dialog.openGasDialog(gasLimit, 10);
    dialogRef.afterClosed().subscribe(async result=>{
      console.log("result",result);
      if(typeof(result) != 'undefined'){
        let options = JSON.parse(result);
        options.data = data;

        let txInfo = await this._rawtx.contractCreationRaw(options);
        console.log(txInfo);
        
        let contractInfo =  this._forms.getValuesObject(this.inputs, this.constructorForm);
    this.sendDialogService.openConfirmDeploy(txInfo[0], 0, txInfo[1], txInfo[1], 'contractDeploy', {type:this.getControl('contract').value, info: contractInfo})
      }
    })
  }

  async importSubmit(){

    let error = "";
    this.submited = true;
    if(this.constructorForm.invalid){
      return false;
    }
    let loadingDialog = this._dialog.openLoadingDialog();
    let contractAddr = this.getControl('contract').value;
    let isContract = await this._LSCXcontract.checkContract(contractAddr);
    let duplicated = this._contractStorage.isDuplicated(contractAddr, this._account.account.address)
    if(duplicated){
      error = "The contract you are are trying to import is a duplicate"
    } else if (isContract!=false && !duplicated){ 
      let tx = isContract
      if(typeof(tx)!= 'undefined' && tx.contractAddress == contractAddr){
        let type = await this._LSCXcontract.checkType(tx.input);
        //console.log('type',type)
        if(type != ""){
          let contract = new Contract();
          let info= await this._LSCXcontract.getContractModelData(type,contractAddr)
          //console.log("info",info)
          contract.importContract(contractAddr,tx.hash, type, this._account.account.address, info, this._web3.network);
          try{
            this._contractStorage.addContract(contract);
          }catch(e){

            error = e;
          }
        }else{
          error = "The contract you are are trying to import isn't a LSCX contract"
        }
      }else{
        error = "The contract you are are trying to import isn't a LSCX contract"
      }
    } else{
      error = "The contract you are are trying to import isn't a LSCX contract"
    }
    let title = (error=="")? 'Your contract has been successfully imported' : 'Unable to import contract';
    let message = (error=="")? 'You can find it in the contracts list' : 'Something was wrong';
    loadingDialog.close();
    let dialogRef = this._dialog.openErrorDialog(title,message, error);

    dialogRef.afterClosed().subscribe(()=>{
      if(error == ''){
        this.router.navigate(['/contracts/contract-page']);
      }
    })
  }

  activeButton(action){
    this.submited = false;
    if(action=="create"){
      this.create = true;
      this.getControl('contract').setValidators(Validators.required)
    }else{
      this.create = false;
      this.getControl('contract').setValidators([Validators.required, ValidateAddress])
    }

    if(this.getControl('contract').value != null){
      this.getControl('contract').setValue(null);
      let inputs = []
      inputs = this._LSCXcontract.getConstructor(this.abi);
      this.inputs = [];
      this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);  
    }
  }

  openInfo(){
    let contract = this.getControl('contract').value
    console.log(contract);
    this._dialog.openContractDialog(contract);
    this.getConstructor();
  }

}
