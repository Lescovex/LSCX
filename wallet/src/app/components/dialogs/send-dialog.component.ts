import { Component, Inject  } from '@angular/core'
import { Router } from '@angular/router'

import { DialogService } from '../../services/dialog.service'
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';


import { Web3 } from '../../services/web3.service'
import { AccountService } from '../../services/account.service'

import { Contract } from '../../models/contract';
import { ContractStorageService } from '../../services/contractStorage.service';
import { MarketService } from '../../services/market.service';

@Component({
  selector: 'send-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendDialogComponent{
  insufficient = false;
  constructor(public _web3: Web3, public _account: AccountService, private router: Router, public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendDialogComponent>, private _contractStorage: ContractStorageService, private _market: MarketService) {
    if(parseInt(_web3.web3.toWei(this._account.account.balance,'ether')) < data.total ){
      this.insufficient= true;
    }
  }
   

  async sendTx(pass){
    let self = this;
    let error = "";
    let title = "";
    let message = "";
    let txs: any[];

    if (typeof(pass)=='undefined' || pass==""){
      return false
    }
    let privateKey;
    try{
      privateKey = this._account.getPrivateKey(pass)
    }catch(e){
      title = "Unable to complete transaction";
      message = "Something went wrong";
      error = e.message;
      self.dialogRef.close();
      let dialogRef = self.dialogService.openErrorDialog(title,message,error);
      return false
    }
    if(typeof(this.data.tx.length) == 'undefined'){
      txs = [this.data.tx]
    }else{
      txs = this.data.tx
    }

    for(let i=0; i<txs.length; i++){
      txs[i].sign(privateKey);
      let serialized = "0x"+(txs[i].serialize()).toString('hex');
      let sendResult = await this._web3.sendRawTx(serialized);
     
      self.dialogRef.close();

      if(sendResult instanceof Error){
        title = "Unable to complete transaction";
        message = "Something went wrong"
        error = sendResult.message;
        self.dialogRef.close();
        let dialogRef = self.dialogService.openErrorDialog(title,message,error);
      }else{
        if(this.data.action == "order") {
          let hash = await this._market.orderHash(this.data.hashParams)
          let sign = this._market.signOrder(hash, privateKey);
          let order = await this._market.placeOrder(this.data.hashParams, sign);
        }

        let pending: any = null;
        while(pending == null){
          pending = await self._web3.getTx(sendResult);
        }
        pending.timeStamp = Date.now()/1000;
        self._account.addPendingTx(pending);
        if(this.data.action == 'contractDeploy'){
          let contract =  new Contract();
          contract.deployContract(sendResult, this.data.contract.info, this.data.contract.type, this._account.account.address, this._web3.network);
          this._contractStorage.addContract(contract);
          this._contractStorage.checkForAddress();
        }
        if(i==txs.length-1){
          title = "Your transaction has been sended";
          message = "You can see the progress in the history tab"
          self.dialogRef.close();
          let dialogRef = self.dialogService.openErrorDialog(title, message, error, this.data.action);
          dialogRef.afterClosed().subscribe(result=>{
              if(typeof(result)!= 'undefined' || result != ''){
                this.router.navigate(['/wallet/history']);
              }
          })
        }
        
      }
    }
  }

  closeDialog(){
    this.dialogRef.close();
  }

}