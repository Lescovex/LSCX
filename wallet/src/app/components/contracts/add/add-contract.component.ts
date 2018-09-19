import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ValidateAddress } from '../../../validators/address-validator.directive'; 

import { LCXContractService } from '../../../services/LCX-contract.service'
import { FormsService } from '../../../services/forms.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Contract } from '../../../models/contract';
import { AccountService } from '../../../services/account.service';
import { ContractStorageService } from '../../../services/contractStorage.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';


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
  public zero = "0"
  constructor(public _LCXcontract: LCXContractService, private _fb: FormBuilder, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _contractStorage: ContractStorageService, private _dialog: DialogService, private router: Router, private _web3: Web3) {
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
        inputs = this._LCXcontract.getConstructor(this.abi);
        this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);
      }
      
      this.contract = contract;
      //console.log("get abi");
      this.abi = await this._LCXcontract.getAbi(contract);
      
      inputs = this._LCXcontract.getConstructor(this.abi);
      inputs = this._LCXcontract.addDecimalsConst(inputs, contract)
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

    let type = this.getControl('contract').value;
    let byteCode = await this._LCXcontract.getBytecode(type);
    let args = this._forms.getValues(this.inputs, this.constructorForm, type);

    let data = await this._LCXcontract.getDeployContractData(type, byteCode, args);
    let txInfo = await this._rawtx.contractCreationRaw(data);
    let contractInfo =  this._forms.getValuesObject(this.inputs, this.constructorForm);
    this.sendDialogService.openConfirmDeploy(txInfo[0], 0, txInfo[1], txInfo[1], 'contractDeploy', {type:this.getControl('contract').value, info: contractInfo})

  }

  async importSubmit(){

    let error = "";
    this.submited = true;
    if(this.constructorForm.invalid){
      return false;
    }
    let loadingDialog = this._dialog.openLoadingDialog();
    let contractAddr = this.getControl('contract').value;
    let isContract = await this._LCXcontract.checkContract(contractAddr);
    let duplicated = this._contractStorage.isDuplicated(contractAddr, this._account.account.address)
    if(duplicated){
      error = "The contract you are are trying to import is a duplicate"
    } else if (isContract!=false && !duplicated){ 
      let tx = isContract
      if(typeof(tx)!= 'undefined' && tx.contractAddress == contractAddr){
        let type = await this._LCXcontract.checkType(tx.input);
        //console.log('type',type)
        if(type != ""){
          let contract = new Contract();
          let info= await this._LCXcontract.getContractModelData(type,contractAddr)
          //console.log("info",info)
          contract.importContract(contractAddr,tx.hash, type, this._account.account.address, info, this._web3.network);
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
    } else{
      error = "The contract you are are trying to import isn't a LCX contract"
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
      inputs = this._LCXcontract.getConstructor(this.abi);
      this.inputs = [];
      this.constructorForm = this._forms.removeControls(inputs, this.constructorForm);  
    }
  }
}
