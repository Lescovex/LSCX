import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core'

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

export class SendTokensPage implements OnInit, OnDestroy, DoCheck{
  tokens:  any[];
  allTokens: any[];
  addr: string = "";
  receiverAddr: string = "";
  amount: number = 0;
  token: any;
  errors:any = {
    receiver:"",
    amount:""
  }
  submited = false;

  constructor(public _rawtx: RawTxService,protected _account: AccountService, private sendDialogService: SendDialogService, private _token : TokenService,) {
    if('tokens' in this._account.account && this._account.tokens.length > 0){
      this.allTokens = this._account.tokens.filter(x=>x);
      this.setTokens();
      this.token = this._account.tokens[0];
    }
  }

  ngOnInit() {
    this.token = this._account.tokens[0];
  }

  ngDoCheck() {
    if(this._account.updatedTokens && this._account.tokenInterval==null){
      this.setTokens();
    }
    if(JSON.stringify(this.allTokens) != JSON.stringify(this._account.tokens)){
      this.setTokens();
      this.allTokens = this._account.tokens.filter(x=>x);
    }
  }

  ngOnDestroy(){
    this._account.clearIntervalTokens();
  }

  async setTokens() {
    let tokens = this._account.tokens.filter(token => token.balance > 0 && !token.deleted);
    tokens.sort((a,b)=> (a.tokenSymbol).localeCompare(b.tokenSymbol));
    this.tokens = tokens;
  }

  async sendTokens(form) {
    this.submited = true;
    console.log(form)
    if(form.invalid){
      return false;
    }
    this._token.setToken(form.controls.token.value.contractAddress);

    let amount = parseFloat(form.controls.amount.value) * Math.pow(10,parseInt(form.controls.token.value.tokenDecimal));
    console.log(amount);
    let txData = await this._token.getDataTransfer(form.controls.receiverAddr.value, Math.floor(amount))
    let tx =  await this._rawtx.createRaw(form.controls.token.value.contractAddress, 0, {data:txData})
    this.sendDialogService.openConfirmSend(tx[0], form.controls.receiverAddr.value, this.amount, tx[1], tx[1] , 'transfer',form.controls.token.value.tokenSymbol)
  }

}
