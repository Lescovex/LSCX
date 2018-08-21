import { Component, OnInit } from '@angular/core'

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

/*Services*/
import { AccountService } from '../../../services/account.service';
import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';

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

  constructor(public _web3: Web3,private _account: AccountService, private sendDialogService: SendDialogService) {
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

    let chainId = 3;
    let acc = this._account.account;
    let amountW = this._web3.web3.toWei(amount,'ether');
    let gasPrice  = this._web3.web3.toHex(this._web3.web3.toWei('1','gwei'));
    let nonce = await this._web3.getNonce(acc.address)
    
    let txParams = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: this._web3.web3.toHex(21000),
      to: receiverAddr,
      value: this._web3.web3.toHex(amountW),
      data: this._web3.web3.toHex(trans_data),
      chainId:'0x3'
    }
    //console.log(txParams)
    
    let tx = new EthTx(txParams);
    
    txParams.gasLimit='0x'+tx.getBaseFee().toString(16);
    let tx2= new EthTx(txParams);

    let cost = parseInt(tx2.getUpfrontCost().toString());
    let balance =  this._web3.web3.toWei(this._account.account.balance,'ether');

    //console.log("value ",amount," cost:",cost,"---",balance);
    if(cost> balance){ 
      this.errors.amount = 'Insufficient funds';
      return false;
    }else{
      this.errors.amount ="";
    }

    this.sendDialogService.openConfirmSend(tx2, receiverAddr, amount, (cost-amountW), cost, 'send')
  }

}
