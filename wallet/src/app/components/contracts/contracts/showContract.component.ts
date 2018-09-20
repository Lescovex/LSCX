import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';

import { LSCXContractService } from '../../../services/LSCX-contract.service';
import { FormsService } from '../../../services/forms.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { AccountService } from '../../../services/account.service';
import { DialogService } from '../../../services/dialog.service';
import { Router } from '@angular/router';
import { Web3 } from '../../../services/web3.service';

@Component({
  selector: 'app-show-contract',
  templateUrl: './showContract.component.html',
})
export class ShowContract implements OnInit{
  @Input() moreInfo;
  @Input() functions;

  @Output() back = new EventEmitter<boolean>();

  protected submited: boolean = false;
  protected contractInfo: any;
  protected functionForm: FormGroup;
  
  protected infoFunctions = [];
  protected transFunctions = [];
  protected funct: any;
  protected owner: string;
  protected response: any = null;
  
  constructor(public _LSCXcontract: LSCXContractService, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _dialog: DialogService, private router : Router, private _web3: Web3) {
    this.functionForm = new FormGroup({
      functionCtrl: new FormControl(null,Validators.required),
    })
    this.contractInfo = this._LSCXcontract.contractInfo;
  }

  ngOnInit(){
    this.moreInfo.forEach(info=>{
      if(info[0]=="owner"){
        this.owner=info[1]
      }
    })
  }

  getControl(controlName: string): AbstractControl{
    return this.functionForm.get(controlName);
  }

  showFunction(){
    let funct = this.getControl('functionCtrl').value
    if(funct != this.funct){
      this.submited = false;
      this.response = null;
      //Remove prev controls
      if(this.funct != null){
        this.functionForm = this._forms.removeControls(this.funct.inputs, this.functionForm);
        if(this.funct.payable){
          this.functionForm.removeControl('ethAmount');
        }
      }
      
      this.funct = funct;
      this.functionForm = this._forms.addControls(funct.inputs, this.functionForm);
      if(this.funct.payable){
        this.functionForm.addControl('ethAmount', new FormControl(0, [Validators.required, Validators.min(0)]));
      }
      let element = document.getElementById('contract');
    }
  }

  async onSubmit(){
    this.submited = true;
    if(this.functionForm.invalid){
      return false
    }
    let params = this._forms.getValues(this.funct.inputs, this.functionForm, this.contractInfo.type);
    if(this.funct.constant){  
      let response = await this._LSCXcontract.callFunction(this._LSCXcontract.contract, this.funct.name, params);
      if(this.funct.decimals == 'decimals'){
        let number = parseInt(response.toString()) /Math.pow(10,this.contractInfo.decimals);
				let zero = '0'
				this.response = number.toLocaleString('en') + "."+zero.repeat(this.contractInfo.decimals)
      }else if(this.funct.decimals == "eth"){
        let number = this._web3.web3.fromWei(parseInt(response.toString()),'ether')
				this.response = number.toLocaleString('en')
      }else{
        this.response = response;
      }
    }else{
      let dialogRef = this._dialog.openLoadingDialog();
      let data = await this._LSCXcontract.getFunctionData(this.funct.name, params)
      let amount = 0;
      if(this.funct.payable){
        amount =  parseFloat(this.getControl('ethAmount').value)
      }
      let tx =  await this._rawtx.createRaw(this.contractInfo.address, amount, {data:data})
      dialogRef.close();
      //tx, to, amount, fees, total, action, token?
      this.sendDialogService.openConfirmSend(tx[0], this.contractInfo.address, tx[2],tx[1]-tx[2], tx[1], "send")
  }
}

  decimalsOutput(value){
    let result = value/Math.pow(10,this.contractInfo.decimals);
    return result
  }

  changeValue(inputName){
    let value = parseFloat(this.getControl(inputName).value).toFixed(this.contractInfo.decimals);
    this.functionForm.controls[inputName].setValue(value);
  }

  goBack(){
    this.back.emit(true);
  }

}
