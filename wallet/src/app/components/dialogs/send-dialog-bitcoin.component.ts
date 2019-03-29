import { Component, Inject  } from '@angular/core';
import { Router } from '@angular/router';

import { DialogService } from '../../services/dialog.service';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { BitcoinAccountService } from '../../services/account-bitcoin.service'

var ElectrumCli = require('electrum-client');
var CryptoJS = require("crypto-js");
var bitcoin = require("bitcoinjs-lib");

@Component({
  selector: 'send-dialog-bitcoin',
  templateUrl: './send-dialog-bitcoin.component.html'
})
export class BitcoinSendDialogComponent{
  submited : boolean = false;
  protected password;
  constructor(protected _account : BitcoinAccountService,private router: Router, public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<BitcoinSendDialogComponent>) {
    console.log("BitcoinSendDialogComponent constructor");
   }
  async sendTx(pass, data){

    this.submited = true;

    let self = this;
    let error = "";
    let title = "";
    let message = "";

    if (typeof(pass)==null || pass==""){

      return false;
    }

    let sender = data.sender;
    let receiver = data.receiver;
    let amount = data.amount * 100000000;

    if(amount < 1){
      return false;
    }

    let wallet = JSON.parse(localStorage.getItem('btcAcc'));
    let acc = wallet.find(x => (x.address).toLowerCase() === sender.toLowerCase());
    let item = acc.wif;

    var bytes2  = CryptoJS.AES.decrypt(item.toString(),pass);


    try {
      var wif = bytes2.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      error = e;
      this.submited = true;
      return false;
    }
    let btc = bitcoin.networks.bitcoin;
    const txb = new bitcoin.TransactionBuilder();

    txb.setVersion(1)

    const ecl = new ElectrumCli(this._account.config.port, this._account.config.url, 'tcp');
    await ecl.connect();
    const ver = await ecl.server_version("1.8.12","1.4");

    let keyPair;
    try {
      keyPair = bitcoin.ECPair.fromWIF(wif);
    } catch (error) {
      console.log("KeyPair err???", error);
      title = "Unable to complete transaction";
        message = "Something went wrong"
        error = "Invalid password";
        self.dialogRef.close();

        let dialogRef = self.dialogService.openErrorDialog(title,message,error);
        return false;
    }

    let script = bitcoin.address.toOutputScript(sender)
    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = new Buffer(hash.reverse())
    let scripthash  = reversedHash.toString('hex');

    let prevBalance = await ecl.blockchainScripthash_getBalance(scripthash)

    if(prevBalance.confirmed >= amount){
      try{

        let to = receiver;
        ecl.subscribe.on('blockchain.headers.subscribe', (v) => console.log(v))
        const unspent = await ecl.blockchainScripthash_listunspent(scripthash)

        let transactionFee = 1000;

        let amountToKeep = (prevBalance.confirmed - amount) - transactionFee;
        let amountToSend = (prevBalance.confirmed - amountToKeep)-transactionFee;
        console.log("Keep",amountToKeep);
        console.log("Send", amountToSend)

        let sum = 0;
        let count = 0;
        while(sum < amount){
          for (let i = 0; i < unspent.length; i++) {
            txb.addInput(unspent[i].tx_hash, unspent[i].tx_pos);
            count++;
            sum =  sum + unspent[i].value;
          }
        }

        try {
          txb.addOutput(to, amountToSend);
        } catch (error) {
          console.log(error)
        }
        if(prevBalance.confirmed > amount){
          txb.addOutput(sender, amountToKeep);
        }
        console.log("txb before sign",txb)
        if(count > 0){
          let j = 0
          while(j < count){
            txb.sign(j,keyPair);
            j++;
          }
        }
        console.log("txb after sign",txb)
        let txString = txb.build().toHex();
        console.log("transactionString",txString)
        let sendResult = await ecl.blockchainTransaction_broadcast(txString);
        this.router.navigate(['/btcwallet/btcglobal']);
      }catch(e){
        title = "Unable to complete transaction";
        message = "Something went wrong"
        error = e.message;
        self.dialogRef.close();
        let dialogRef = self.dialogService.openErrorDialog(title,message,error);
      }
    }else{
      title = "Unable to complete transaction";
      message = "Something went wrong"
      error = "You don't have enough funds";
      self.dialogRef.close();
      let dialogRef = self.dialogService.openErrorDialog(title,message,error);
      dialogRef.afterClosed().subscribe(result=>{

          this.router.navigate(['/btcwallet/btcglobal']);

    })
    }


    self.dialogRef.close();


  }

  closeDialog(){
    this.dialogRef.close();
  }

}
