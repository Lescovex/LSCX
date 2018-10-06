import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core'

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

/*Services*/
import { AccountService } from '../../../services/account.service'
import { SendDialogService } from '../../../services/send-dialog.service'
import { TokenService } from '../../../services/token.service'
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';

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

  constructor(public _rawtx: RawTxService,protected _account: AccountService, private _web3: Web3, private sendDialogService: SendDialogService, private _token : TokenService,private _dialog: DialogService) {
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
    
    if(form.invalid){
      return false;
    }

    this._token.setToken(form.controls.token.value.contractAddress);
    let receiver = form.controls.receiverAddr.value;
    let amount = parseFloat(form.controls.amount.value) * Math.pow(10,parseInt(form.controls.token.value.tokenDecimal));
    
    let txData = await this._token.getDataTransfer(receiver, Math.floor(amount));
    let gasLimit = 250000;

    let dialogRef = this._dialog.openGasDialog(await gasLimit, 1);
    dialogRef.afterClosed().subscribe(async result=>{
      
      if(typeof(result) != 'undefined'){
        let obj = JSON.parse(result);
        
        obj.data = txData;
        let tx =  await this._rawtx.createRaw(form.controls.token.value.contractAddress, 0, obj)
        this.sendDialogService.openConfirmSend(tx[0], form.controls.receiverAddr.value, amount, tx[1], tx[1] , 'transfer',form.controls.token.value.tokenSymbol, form.controls.amount.value);
      }
    });
  }

}
