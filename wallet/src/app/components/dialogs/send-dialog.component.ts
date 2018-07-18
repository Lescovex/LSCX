import { Component, Inject  } from '@angular/core'
import { Router } from '@angular/router'

import { DialogService } from '../../dialog.service'
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';


import { Web3 } from '../../web3.service'
import { AccountService } from '../../account.service'

@Component({
  selector: 'send-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendDialogComponent{

  constructor(public _web3: Web3, public _account: AccountService, private router: Router, public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendDialogComponent>) {
   }
   

  async sendTx(pass){
    //check pass

    let self = this;
    let error = "";
    let title = "";
    let message = "";

    if (typeof(pass)=='undefined' || pass==""){
      console.log(pass)
      return false
    }
    let privateKey;
    try{
      privateKey = this._account.getPrivateKey(pass)
    }catch(e){
      title = "Unable to complete transaction";
      message = "Something went wrong"
      error = e.message;
      self.dialogRef.close();
      let dialogRef = self.dialogService.openErrorDialog(title,message,error);
    }

    
    this.data.tx.sign(privateKey);
    let serialized = "0x"+(this.data.tx.serialize()).toString('hex');
    let sendResult = await this._web3.sendRawTx(serialized);
    self.dialogRef.close();

    if(sendResult instanceof Error){
      title = "Unable to complete transaction";
      message = "Something went wrong"
      error = sendResult.message;
      let dialogRef = self.dialogService.openErrorDialog(title,message,error);


    }else{
      let pending: any = await self._web3.getTx(sendResult);
      pending.timeStamp = Date.now()/1000;
      //console.log(pending)
      self._account.addPendingTx(pending);

      title = "Your transaction has been sended";
      message = "You can see the progress in the history tab"
      console.log(this.data.action)
      let dialogRef = self.dialogService.openErrorDialog(title, message, error, this.data.action);
      dialogRef.afterClosed().subscribe(result=>{
          if(typeof(result)!= 'undefined' || result != ''){
            this.router.navigate(['/wallet/history']);
            /*if(result == 'send'){
              this.router.navigate(['/wallet/history']);
            }else{
              this.router.navigate(['/tokens/general']);
            }*/
          }
      })
    }

  }

  closeDialog(){
    this.dialogRef.close();
  }

}