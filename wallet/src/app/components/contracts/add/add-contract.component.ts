import { Component} from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidateAddress } from '../../../validators/address.validator'; 

import { ContractService } from '../../../services/contract.service'
import { FormsService } from '../../../services/forms.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Contract } from '../../../models/contract';
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-add-contract',
  templateUrl: './add-contract.component.html',
})
export class AddContractPage {
  public contract = null;
  public constructorForm: FormGroup;
  public inputs = [];
  public submited: boolean = false;
  public create = true;
  constructor(public _contract: ContractService, private _fb: FormBuilder, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService) {
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
        inputs = this._contract.getConstructor();
        this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);
      }
      
      this.contract = contract;
      await this._contract.setAbi(contract);
      
      inputs = this._contract.getConstructor();
      this.constructorForm = this._forms.addControls(inputs, this.constructorForm);
      this.inputs=inputs;
    }

      
  }

  getControl(controlName: string): AbstractControl{
    return this.constructorForm.get(controlName);
  }

  async createSubmit(){
    this.submited = true;
    console.log(this.constructorForm);
    if(this.constructorForm.invalid){
      return false
    }
    let byteCode = await this._contract.getBytecode(this.getControl('contract').value);
    let args = this._forms.getValues(this.inputs, this.constructorForm);
    let data = await this._contract.getDeployContractData(byteCode, args);
    console.log(byteCode, data)
    let txInfo = await this._rawtx.contractCreationRaw(data);
    console.log(txInfo[0])
    let contractInfo =  this._forms.getValuesObject(this.inputs, this.constructorForm);
    console.log(contractInfo)
    this.sendDialogService.openConfirmDeploy(txInfo[0], 0, txInfo[1], txInfo[1], 'contractDeploy', {type:this.getControl('contract').value, info: contractInfo})

  }

  async importSubmit(){

    let error = "";
    this.submited = true;
    if(this.constructorForm.invalid){
      return false;
    }

    let contractAddr = this.getControl('contract').value;
    let response = await this._contract.checkContract(contractAddr).toPromise();
    console.log(response)
    if(response.status == 1){ 
      let result = response.result[0];
      if(typeof(result)!= 'undefined' && result.contractAddress == contractAddr){
        let type = await this._contract.checkType(result.input);
        console.log("type",type)
        if(type != ""){
          let contract = new Contract();
          let info= await this._contract.getContractModelData(type,contractAddr)
          contract.importContract(contractAddr,result.hash, type, this._account.account.address, info);
          try{
            this._contractStorage.addContract(contract);
          }catch(e){

            error = e;
          }
        }else{
          error = "The contract you are are trying to import isn't a LCX contract"
        }
      }else{
        error = "The contract you are are trying to import isn't a LCX contract"
      }
      
    }
    let title = (error=="")? 'Your contract has been successfully imported' : 'Unable to import contract';
    let message = (error=="")? 'You can find it in the contracts list' : 'Something was wrong';
    let dialoRef = this._dialog.openErrorDialog(title,message, error);
    

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
      inputs = this._contract.getConstructor();
      this.inputs = [];
      this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);  
    }
  }
}
