import { Component, OnInit } from '@angular/core'
import { Http } from '@angular/http';

/*Services*/
import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';

import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { DialogService } from '../../../services/dialog.service';

import { RawTx } from '../../../models/rawtx';
import BigNumber from 'bignumber.js';

import * as EthUtil from 'ethereumjs-util';

@Component({
  selector: 'send-page',
  templateUrl: './send.html',
})

export class SendPage implements OnInit {
  public countries:any[]; 
  protected sendTo: string;
  public country: any;
  public submited:boolean;
  public showPrefixes:boolean;

  constructor(private http: Http, private _web3: Web3,private _account: AccountService, private _wallet: WalletService, private _dialog: DialogService, private sendDialogService: SendDialogService) {
    this.sendTo = "address";
    this.countries = require('../../../../assets/json/phonePrefixes.json');
    this.showPrefixes =false;
    this.submited =false;
    this.countries.map(x=> x.flag = x.code.toLowerCase()+".svg");  
  }

  async ngOnInit() {
    let ipResponse = await this.http.get("https://ipinfo.io").map(res => res.json()).toPromise();
    let code = ipResponse.country;
    this.country = this.countries.find(x=> x.code == code);
    
  }
  toggleShow(){
    this.showPrefixes = !this.showPrefixes;
}

  async sendEth(form) {
    console.log(form.controls)
    this.submited = true;
    
    if(form.invalid){
      return false;
    }
    let tx;
    let gasLimit;
    let receiver;
    let seedOptions: any;
    let data: string = form.controls.trans_data.value;

    if(typeof(data)=="undefined" || data == "" ) {
      data = "";
    }
    let amount = this._web3.web3.toWei(form.controls.amount.value, 'ether');

    if(this.sendTo == "address"){
      receiver = form.controls.receiverAddr.value;
    }else {
      let receiverData = await this.getBip39(form);
      receiver = receiverData.address;
      seedOptions = {
        type : this.sendTo,
        seed : receiverData.seed
      }
      if(this.sendTo == "mobile") {
        seedOptions.to ="+"+form.controls.prefix.value.dial_code+form.controls.receiverMobile.value;
      }
      if(this.sendTo == "email") {
        seedOptions.to = form.controls.receiverEmail.value
      }
      console.log("seddOptions", seedOptions);
    }

    try{
      if(data != "" ){
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, this._web3.web3.toHex(data), amount);
      } else {
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, "", amount)
      }
    }catch(e){
      gasLimit = await this._web3.blockGas();
    }

    let dialogRef = this._dialog.openGasDialog(await gasLimit, 1);
    dialogRef.afterClosed().subscribe(async result=>{
      
      if(typeof(result) != 'undefined'){
        let obj = JSON.parse(result);

        if(typeof(form.controls.trans_data.value)!="undefined" && form.controls.trans_data.value != ""){
          obj.data = form.controls.trans_data.value;
        }
        
        let tx = new RawTx(this._account, receiver,new BigNumber(amount), obj.gasLimit, obj.gasPrice ,this._web3.network, data);

        if(this.sendTo == "address"){ 
          this.sendDialogService.openConfirmSend(tx.tx, receiver, amount,tx.gas, tx.cost, "send");
        }else{
          this.sendDialogService.openConfirmAlternativeSend(tx.tx, receiver, amount,tx.gas, tx.cost, "send", seedOptions);
        }
        
      }
    })
  }

  async getBip39(form){
    const bip39 = require('bip39');
    const hdkey = require('hdkey');
    const strength: number = 128;
    const wordName = "english";
    
    const rng = null;
    const wordList = eval('bip39.wordlists.'+wordName);
    
    const mnemonic = bip39.generateMnemonic(strength, rng, wordList);
    
    let seed = bip39.mnemonicToSeed(mnemonic);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const privateKey= hdwallet.privateKey;
    let priv  = EthUtil.bufferToHex(privateKey);
   
    return {address: EthUtil.bufferToHex(EthUtil.privateToAddress(priv)), seed: mnemonic };
  }

  onSelectCountry(country){
    if(country != null){
      this.country = country;
    } 
    this.toggleShow();
  }
}
