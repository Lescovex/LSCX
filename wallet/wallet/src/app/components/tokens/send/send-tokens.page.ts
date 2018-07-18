import { Component, OnInit, OnDestroy } from '@angular/core'

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

/*Services*/
import { AccountService } from '../../../account.service'
import { Web3 } from '../../../web3.service'
import { SendDialogService } from '../../../send-dialog.service'
import { TokenService } from '../../../token.service'

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

  constructor(public _web3: Web3,protected _account: AccountService, private sendDialogService: SendDialogService, private _token : TokenService,) {
    if('tokens' in this._account.account && this._account.account.tokens.length > 0){
      this.token = this._account.account.tokens[0];
    }
  }

  ngOnInit() {
    this.interval=this._account.startIntervalTokens();
  }
  ngOnDestroy(){
    clearInterval(this.interval)
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
    let gasLimit = await this._web3.estimateGas(this._account.account.address,this.token.contractAddress,txData);

    let acc = this._account.account;
    
    let gasPrice  = this._web3.web3.toHex(this._web3.web3.toWei('1','gwei'));
    let nonce = await this._web3.getNonce(acc.address)
    
    let txParams = {
      nonce: this._web3.web3.toHex(nonce),
      gasPrice: gasPrice,
      gasLimit: this._web3.web3.toHex(gasLimit),
      to: this.token.contractAddress,
      data: txData,
      chainId:'0x3'
    }
    //console.log(txParams)
    let fees = gasLimit*gasPrice;
    let tx = new EthTx(txParams);
    
    let cost = fees
    let balance =  this._web3.web3.toWei(this._account.account.balance,'ether');

    //console.log("value ",amount," cost:",cost,"---",balance);
    if(cost> balance){ 
      this.errors.amount = 'Insufficient funds';
      return false;
    }else{
      this.errors.amount ="";
    }

    this.sendDialogService.openConfirmSend(tx, this.receiverAddr, this.amount, fees, cost , 'transfer',this.token.tokenSymbol)
  }

}
