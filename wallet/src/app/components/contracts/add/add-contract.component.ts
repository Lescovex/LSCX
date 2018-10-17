import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidateAddress } from '../../../validators/address-validator.directive'; 

import { LSCXContractService } from '../../../services/LSCX-contract.service'
import { FormsService } from '../../../services/forms.service'
import { SendDialogService } from '../../../services/send-dialog.service';
import { LSCX_Contract } from '../../../models/LSCX_contract';
import { CustomContract } from '../../../models/CustomContract';
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { ContractDialogComponent } from './contract-dialog.component';
import { MdDialog } from '@angular/material';
import { EtherscanService } from '../../../services/etherscan.service';
import { DeployRawTx } from '../../../models/rawtx';

import * as Web3L from 'web3';
import { first } from '../../../../../node_modules/rxjs/operator/first';
var querystring = require("querystring");
var fs = require('fs');
import { Http, Headers, RequestOptions } from "@angular/http";

@Component({
  selector: 'app-add-contract',
  templateUrl: './add-contract.component.html',
})

export class AddContractPage {
  web3: Web3L;

  public contract = null;
  public abi;
  public constructorForm: FormGroup;
  customContractForm: FormGroup;
  public inputs = [];
  public submited: boolean = false;
  public submitedOther: boolean = false;
  public create = true;
  public zero = "0";
  public contracts=['Asset-Backed Tokens (ABT)', 'Crypto Currencies (CYC)', 'Income Smart Contract (ISC)', 'Crypto Investment Fund (CIF)'];

  constructor(public _LSCXcontract: LSCXContractService, private _fb: FormBuilder, private _forms: FormsService, private sendDialogService : SendDialogService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService, private router: Router, private _web3: Web3, public dialog: MdDialog, private _scan: EtherscanService) {
    this.constructorForm =  new FormGroup({
      contract:new FormControl(null,Validators.required),
    })
    this.customContractForm =  new FormGroup({
      contract:new FormControl(null,[Validators.required, ValidateAddress]),
      name: new FormControl(null,Validators.required)
    })
  }

  async getConstructor(){
    
    let contract = this.getControl('contract').value

    if(contract != this.contract){
      this.submited = false;
      let inputs = [];
      //Remove prev controls
      if(this.contract != null){
      
        inputs = this._LSCXcontract.getConstructor(this.abi);
        this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);
      }
      
      this.contract = contract;
      
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

    let getinfo = this.constructorForm;
    //console.log("getInfo?????",getinfo);
    
    let argsTo;
    argsTo ={
      contract : getinfo.value.contract,
    }
      
    localStorage.setItem("deployInfo",JSON.stringify(argsTo))
    
    try {
      gasLimit = await this._web3.estimateGas(this._account.account.address, "", data, 0);
      
    }catch(e){
      gasLimit = 3500000;
    }

    dialogRef.close();
    dialogRef = this._dialog.openGasDialog(gasLimit, 10);
    dialogRef.afterClosed().subscribe(async result=>{
      if(typeof(result) != 'undefined'){
        let options = JSON.parse(result);

        let tx = new DeployRawTx(this._account, options.gasLimit, options.gasPrice, this._web3.network, "0x"+data)
        
        let contractInfo =  this._forms.getValuesObject(this.inputs, this.constructorForm);
        this.sendDialogService.openConfirmDeploy(tx.tx, 0, tx.gas, tx.cost, 'contractDeploy', {type:this.getControl('contract').value, info: contractInfo})
      }
    })
  }

  async importLSCX(){
    let error = "";
    this.submited = true;
    if(this.constructorForm.invalid){
      return false;
    }
    let loadingDialog = this._dialog.openLoadingDialog();
    let contractAddr = this.getControl('contract').value;
    let isContract = await this._LSCXcontract.checkContract(contractAddr);
    let duplicated = this._contractStorage.isDuplicated(contractAddr, this._account.account.address);
    if(duplicated){
      error = "The contract you are are trying to import is a duplicate"
    } else if (isContract!=false && !duplicated){ 
      let tx = isContract;
      let type = await this._LSCXcontract.checkType(tx.input);
      if(type != ""){
        let contract = new LSCX_Contract();
        let info= await this._LSCXcontract.getContractModelData(type,contractAddr)
        contract.importContract(contractAddr,tx.hash, type, this._account.account.address, info, this._web3.network);
        try{
          this._contractStorage.addContract(contract);
        }catch(e){
          error = e;
        }
      }else{
          error = "The contract you are trying to import isn't a LSCX contract, import with Other Contracts form"
      }
    } else{
      error = "The address you are trying to import isn't a contract"
    }
    let title = (error=="")? 'Your contract has been successfully imported' : 'Unable to import contract';
    let message = (error=="")? 'You can find it in the contracts list' : 'Something was wrong';
    loadingDialog.close();
    let dialogRef = this._dialog.openErrorDialog(title,message, error);

    dialogRef.afterClosed().subscribe(()=>{
      this.submited = false;
      this.constructorForm.reset();
      if(error == ''){
        this.router.navigate(['/contracts/contract-page']);
      }
    })
  }

  async importCustom(){
    let error = "";
    this.submitedOther = true;
    if(this.customContractForm.invalid){
      return false;
    }
    let loadingDialog = this._dialog.openLoadingDialog();
    let contractAddr = this.customContractForm.controls.contract.value;
    let isContract = await this._LSCXcontract.checkContract(contractAddr);
    let duplicated = this._contractStorage.isDuplicated(contractAddr, this._account.account.address);
    if(duplicated){
      error = "The contract you are are trying to import is a duplicate"
    } else if (isContract!=false && !duplicated){ 
      let tx = isContract;
      let type = await this._LSCXcontract.checkType(tx.input);
      if(type != ""){
          error = "The contract you are trying to import is a LSCX contract, import with LSCX contracts form"
      }else{
          let isVerified: any = await this.isVerifiedMessages(contractAddr, this.customContractForm.controls.name.value);
          loadingDialog.close();
          let dialogRef = this._dialog.openErrorDialog(isVerified.title,isVerified.message, isVerified.error); 
          dialogRef.afterClosed().subscribe(()=>{
              if(isVerified.error == ''){
                this.router.navigate(['/contracts/contract-page']);
              }
          });
          return false;
      }
    } else {
      error = "The address you are trying to import isn't a contract"
    }
    let title = (error=="")? 'Your contract has been successfully imported' : 'Unable to import contract';
    let message = (error=="")? 'You can find it in the contracts list' : 'Something was wrong';
    loadingDialog.close();
    let dialogRef = this._dialog.openErrorDialog(title,message, error);

    dialogRef.afterClosed().subscribe(()=>{
      this.submited = false;
      this.constructorForm.reset();
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
    let contract = this.getControl('contract').value;
    
    this._dialog.openContractDialog(contract);
  }

  async isVerifiedMessages(contractAddr, name){
    let message;
    let error = "";
    let abi = await this._scan.getAbi(contractAddr)
    if(abi.result == "Contract source code not verified"){
        message = "The contract you are are trying to import isn't verify, its code isn't public."
        error = " ";
    }else{
        let contract = new CustomContract(contractAddr, name, abi.result, this._account.account.address, this._web3.network);
        message = "You can find it in the contracts list"
        this._contractStorage.addContract(contract);
    }
    let title = (error=="")? 'Your contract has been successfully imported' : 'Unable to import contract';
    return {title:title, message:message, error:error}
  }
}
