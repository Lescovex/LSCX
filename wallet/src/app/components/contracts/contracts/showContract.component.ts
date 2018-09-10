import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';

import { LCXContractService } from '../../../services/LCX-contract.service';
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

  public submited: boolean = false;
  public contractInfo: any;
  public functionForm: FormGroup;
  
  public infoFunctions = [];
  public transFunctions = [];
  public funct: any;
  public owner: string;
  
  constructor(public _LCXcontract: LCXContractService, private _forms: FormsService, private _rawtx: RawTxService, private sendDialogService : SendDialogService, private _account: AccountService, private _dialog: DialogService, private router : Router, private _web3: Web3) {
    this.functionForm = new FormGroup({
      functionCtrl: new FormControl(null,Validators.required),
    })
    this.contractInfo = this._LCXcontract.contractInfo;
  }

  ngOnInit(){
    this.moreInfo.forEach(info=>{
      if(info[0]=="owner"){
        this.owner=info[1]
      }
    })
    console.log("funct", this.funct) 
  }

  getControl(controlName: string): AbstractControl{
    return this.functionForm.get(controlName);
  }

  showFunction(){
    let funct = this.getControl('functionCtrl').value
    //console.log("funct",funct.inputs)
    if(funct != this.funct){
      this.submited = false;
      //Remove prev controls
      if(this.funct != null){
        console.log("dentro remove");
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
      let response = await this._LCXcontract.callFunction(this._LCXcontract.contract, this.funct.name, params);
      console.log("response", response)
      if(this.funct.decimals == 'decimals'){
        let number = parseInt(response.toString()) /Math.pow(10,this.contractInfo.decimals);
				let zero = '0'
				response = number.toLocaleString('en') + "."+zero.repeat(this.contractInfo.decimals)
      }else if(this.funct.decimals == "eth"){
        let number = this._web3.web3.fromWei(parseInt(response.toString()),'ether')
				response = number.toLocaleString('en')
      }

      this._dialog.openMessageDialog(this.funct.name, response)
    }else{
      let dialogRef = this._dialog.openLoadingDialog();
      let data = await this._LCXcontract.getFunctionData(this.funct.name, params)
      let amount = 0;
      if(this.funct.payable){
        amount =  parseFloat(this.getControl('ethAmount').value)
      }
      let tx =  await this._rawtx.createRaw(this.contractInfo.address, amount, {data:data})
      console.log(tx)
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
    console.log(value,this.getControl(inputName).value)
  }

  goBack(){
    this.back.emit(true);
  }

}
