import { Component, OnInit, OnDestroy } from '@angular/core'

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

/*Services*/
import { AccountService } from '../../../services/account.service'
import { SendDialogService } from '../../../services/send-dialog.service'
import { TokenService } from '../../../services/token.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';

@Component({
  selector: 'send-tokens-page',
  templateUrl: './send-tokens.html'
})

export class SendTokensPage implements OnInit, OnDestroy{
  interval;
  addr: string = "";
  receiverAddr: string = "";
  amount: number = 0;
  token: any;
  errors:any = {
    receiver:"",
    amount:""
  }

  constructor(public _rawtx: RawTxService,protected _account: AccountService, private sendDialogService: SendDialogService, private _token : TokenService,) {
    if('tokens' in this._account.account && this._account.account.tokens.length > 0){
      this.token = this._account.account.tokens[0];
    }
  }

  ngOnInit() {
    this.interval = this._account.startIntervalTokens();
  }
  ngOnDestroy(){
    clearInterval(this.interval);
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

  async sendTokens() {
    if(this.checkAmount(this.amount) == false || this.checkAddress(this.receiverAddr) == false){
      return false;
    }

    let amount = this.amount * (10 ** this.token.tokenDecimal);
    let txData = await this._token.getDataTransfer(this.receiverAddr, amount)
    let tx =  await this._rawtx.createRaw(this.receiverAddr, 0, {data:txData})
    this.sendDialogService.openConfirmSend(tx[0], this.receiverAddr, this.amount, tx[1], tx[1] , 'transfer',this.token.tokenSymbol)
  }

}
