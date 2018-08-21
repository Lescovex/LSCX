import { Pipe, PipeTransform } from '@angular/core';

import { Web3 } from '../services/web3.service'

@Pipe({ name: 'converter' })

export class ConverterPipe implements PipeTransform {
  _web3 =  new Web3();

  transform(value:any, direction: 'fromWei', unit:string = 'ether') {
    if(direction=='fromWei'){
      return this._web3.web3.fromWei(value, unit)
    }else if(direction =='toWei'){

    }
    return this._web3.web3.toWei(value, unit)
  }
}
