import { Injectable} from '@angular/core';
import { Validators, ValidatorFn, FormGroup, FormControl } from '@angular/forms'
import { ValidateAddress } from '../validators/address-validator.directive'; 
import { ContractService } from './contract.service';
import { Web3 } from './web3.service';

@Injectable()
export class FormsService {
    constructor(private _contract: ContractService, private _web3: Web3){

    }

    getInputType(input){
        if(input.type == 'string' || input.type == 'address' || input.type.indexOf('byte') != -1){
            input.type2 = "text";
        }else if(input.type == 'int' || input.type == 'int8' || input.type == 'int256' || input.type == 'uint' || input.type == 'uint8' || input.type == 'uint256'){
            input.type2 = "number";
        }else if(input.type == 'bool'){
            input.type2 = 'radio';
        }else{
            input.type2="";
        }
        
        return input
    }

    getValidators(input): ValidatorFn[]{
        let validators = [Validators.required]
        if(input.type == 'uint' || input.type == 'uint8' || input.type == 'uint256'){
            validators.push(Validators.min(0))
        }if(input.type == 'address'){
            validators.push(ValidateAddress)
        }
        return validators
    }

    removeControls(inputs, form): FormGroup{
        //this._contract.getConstructor();
        inputs.forEach(input=>{
           form.removeControl(input.name);
        })
        return form
    }

    addControls(inputs, form): FormGroup{
        inputs.forEach(input=>{
            input = this.getInputType(input);
            let value= (input.name=="initialSupply" || input.name=="contractMaxSupply")? 0.0000 :"";
            let validators = this.getValidators(input)
           form.addControl(input.name, new FormControl(value, validators));
          })
        return form
    }

    getValues(inputs, form, file?): Array<any>{
        
        let values = [];
        let type = file;
        inputs.forEach(input=>{
            let value = form.get(input.name).value;
            
            if(input.type2 == 'number'){
                value = parseFloat(value);
                if(input.decimals == "decimals"){
                    value = (type=="LSCX_CYC")? value*Math.pow(10,18): value*Math.pow(10,8);
                }else if(input.decimals == "eth"){
                    value = parseInt(this._web3.web3.toWei(value, 'ether'))
                }
            }
            values.push(value);
          })
          
        return values;
    }

    getValuesObject(inputs, form){
        let valueObj: any = {};
        let type = form.get('contract').value;
        inputs.forEach(input=>{
            let value = form.get(input.name).value;
            if(input.type2 == 'number'){
                value = parseFloat(value);
            }
            if(input.name.indexOf('Name')!=-1){
                valueObj.name=value;
            }else if(input.name.indexOf('Supply')!=-1){
                valueObj.totalSupply=(type=="LSCX_CYC")? value*Math.pow(10,18): value*Math.pow(10,8);
            }else if(input.name.indexOf('Symbol')!=-1){
                valueObj.symbol = value;
            }
            
          })
        return valueObj;
    }
}