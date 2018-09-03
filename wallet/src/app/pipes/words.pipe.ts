import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'separateWords' })

export class SeparateWordsPipe implements PipeTransform {

  transform(value:string) {
    let str = ''
    for(let i=0; i<value.length; i++){
      if(value.charCodeAt(i)>=65 && value.charCodeAt(i)<=90){
        str += " " + value.charAt(i);
      }else{
        str += value.charAt(i);
      }
    }
    return str.toLowerCase();
  }
}
