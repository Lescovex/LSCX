import { AbstractControl } from '@angular/forms'
import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';
import * as EthUtil from 'ethereumjs-util';

export function ValidateAddress(control: AbstractControl): {[key: string]: boolean} | null {
    const invalidAddress = (!EthUtil.isValidAddress(control.value));
    return invalidAddress ? {'invalidAddress': invalidAddress} : null;
}

@Directive({
    selector: '[invalidAddress][formControlName],[invalidAddress][formControl],[invalidAddress][ngModel]',
    providers: [{provide: NG_VALIDATORS, useExisting: ValidateAddressDirective, multi: true}]
})
export class ValidateAddressDirective implements Validator {
    
    validate(c: FormControl): {[key: string]: any} {
        const invalidAddress = (!EthUtil.isValidAddress(c.value));
        return invalidAddress ? {"invalidAddress": invalidAddress} : null;
    }
} 
