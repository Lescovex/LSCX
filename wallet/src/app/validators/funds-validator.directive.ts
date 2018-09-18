import { Directive, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms'
import { NG_VALIDATORS, Validator, ValidatorFn , FormControl } from '@angular/forms';

@Directive({
  selector: '[funds][formControlName],[funds][formControl],[funds][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: InsuficientFundsDirective, multi: true}]
})
export class InsuficientFundsDirective implements Validator {
  @Input() funds;
  
  validate(control: FormControl): {[key: string]: any} {
      const value = control.value>parseFloat(this.funds);
      return value ? {"notFunds": true} : null;
  }
}

export function InsuficientFunds(funds:string): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const value = control.value<parseInt(funds);
    return value ? {"notFunds": true} : null;
  };
}