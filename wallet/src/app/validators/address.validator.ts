import { AbstractControl } from '@angular/forms'
import * as EthUtil from 'ethereumjs-util';

/** A hero's name can't match the given regular expression */
export function ValidateAddress(control: AbstractControl): {[key: string]: boolean} | null {
    const invalidAddress = (!EthUtil.isValidAddress(control.value));
    return invalidAddress ? {'invalidAddress': invalidAddress} : null;
}