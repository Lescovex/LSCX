import { Component, OnInit } from '@angular/core'

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

/*Services*/
import { AccountService } from '../../../services/account.service';
import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';

@Component({
  selector: 'send-page',
  templateUrl: './send.html'
})

export class SendPage implements OnInit {
  addr: string = "";
  privatek: string = "";
  receiverAddr: string = "";
  amount: number = 0;
  errors:any = {
    receiver:"",
    amount:""
  }

  constructor(public _web3: Web3,private _account: AccountService, private sendDialogService: SendDialogService,  private _rawtx: RawTxService) {
    // console.log('SendPage')
  }

  ngOnInit() {
    // console.log("Inited, ", devp2p)
  }

  checkAddress(receiverAddr): boolean {
    if(!EthUtil.isValidAddress(receiverAddr)){
      this.errors.receiver = "invalid receiver address";
      return false
    }else{
      this.errors.receiver =  ""
      return true
    }

  }
  checkAmount(amount):boolean{
    if(amount<0){
      this.errors.amount = "Can not send negative amounts of ETH";
      return false;
    }else{
      this.errors.amount ="";
      return true;
    }
  }

  async sendEth(receiverAddr: string, amount: number, trans_data? : string) {
    if(this.checkAmount(amount) == false || this.checkAddress(receiverAddr) == false){
      return false;
    }
    let tx;
    if(typeof(trans_data)=='undefined'){
      tx =  await this._rawtx.createRaw(receiverAddr, amount)
    }else{
      tx =  await this._rawtx.createRaw(receiverAddr, amount, {data:trans_data})
    }

    this.sendDialogService.openConfirmSend(tx[0], receiverAddr, tx[2],tx[1]-tx[2], tx[1], "send"); 
  }

}
