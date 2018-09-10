import { Directive, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms'
import { NG_VALIDATORS, Validator, ValidatorFn , FormControl } from '@angular/forms';

@Directive({
  selector: '[founds][formControlName],[founds][formControl],[founds][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: InsuficientFoundsDirective, multi: true}]
})
export class InsuficientFoundsDirective implements Validator {
  @Input() founds;
  
  validate(control: FormControl): {[key: string]: any} {
      const value = control.value>parseFloat(this.founds);
      return value ? {"notFounds": true} : null;
  }
}

export function InsuficientFounds(founds:string): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const value = control.value<parseInt(founds);
    return value ? {"notFounds": true} : null;
  };
}