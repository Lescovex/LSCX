import { Component, OnInit } from '@angular/core'


/*Services*/
import { BitcoinAccountService } from '../../../services/account-bitcoin.service';
import { BitcoinWalletService } from '../../../services/wallet-bitcoin.service';
import { SendDialogService } from '../../../services/send-dialog.service';


import { DialogService } from '../../../services/dialog.service';


var bitcoin = require("bitcoinjs-lib");
var ElectrumCli = require('electrum-client');
var CryptoJS = require("crypto-js");

@Component({
  selector: 'btcsend-page',
  templateUrl: './btcsend.html',
  styleUrls: ['./range.page.css']
})

export class BitcoinSendPage implements OnInit {

  addr: string = "";
  privatek: string = "";
  receiverAddr: string = "";
  amount: number = 0;
  errors:any = {
    receiver:"",
    amount:""
  }
  protected senderAddr;
  protected selectedAcc;
  protected interval;
  show: boolean = false;
  message: string = "see password";
  amountErr;

  err;
  constructor(public dialogService: DialogService, private _wallet : BitcoinWalletService, private _account: BitcoinAccountService, private sendDialogService: SendDialogService) {

    this.senderAddr = this._account.account.address;
  }

  async ngOnInit() {
    try {
      await this._account.getAccountsBalances();
    } catch (error) {
      this.err = "This service is not available";
      console.log(error);
    }
  }

  async createBitcoinTx(sender, receiver, value){
    /*
      let getDecimals = this.decimalPlaces(value)
      if(getDecimals > 8){
        this.amountErr = "Amount can't have more than 8 decimals";
        return false;
      }else{
        this.amountErr = null;
      }

      if(value >= this._account.account.balance){
        this.amountErr = "You don't have enough funds";
        return false;
      }else{
        this.amountErr = null;
      }
      if(receiver.length != 34){
        this.errors.receiver = "This address is not valid";
        return false;
      }else{
        this.errors.receiver = null;
      }
      let x = 1;
      if (x > value * 100000000){
        this.amountErr = "Amount must be higher than 0.00000001 BTC";
        return false;
      }else{
        console.log("before confirm send bitcoin dialog")
        this.sendDialogService.openConfirmSendBitcoin(sender, receiver, value);
      }
      */
  }
  decimalPlaces(num) {
    var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) { return 0; }
    return Math.max(
         0,

         (match[1] ? match[1].length : 0)

         - (match[2] ? +match[2] : 0));
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

  showPassword(){
    this.show = !this.show;
    this.message = (this.show == false)? "see password" : "hide password";
    let pass:any = document.getElementById("password");
    pass.type = (this.show == true) ? "text" :"password";
  }
}
