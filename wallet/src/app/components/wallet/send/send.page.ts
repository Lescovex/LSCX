import { Component, OnInit } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';

import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'send-page',
  templateUrl: './send.html'
})

export class SendPage implements OnInit {
  public countries =  require('../../../../assets/json/countries.json');
  public prefixes = require('../../../../assets/json/phonePrefixes.json');
  protected sendTo: string;
  submited = false;

  constructor(public _web3: Web3,private _account: AccountService, private _wallet: WalletService, private _dialog: DialogService, private sendDialogService: SendDialogService,  private _rawtx: RawTxService) {
    this.sendTo = "address";
   
  }

  ngOnInit() {
  }

  async sendEth(form) {
    this.submited = true;
    console.log(form.controls)
    if(form.invalid){
      return false;
    }
    let tx;
    let gasLimit;
    let receiver;

    if(this.sendTo == "address"){
      receiver = form.controls.receiverAddr.value;
    }else {
      receiver = await this.getBip39(form);
    }

    try{
      if(typeof(form.controls.trans_data.value)!="undefined" && form.controls.trans_data.value != "" ){
        console.log("con data")
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, this._web3.web3.toHex(form.controls.trans_data.value), parseInt(this._web3.web3.toWei(form.controls.amount.value,'ether')));
      } else {
        console.log("sin data")
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, "", parseInt(this._web3.web3.toWei(form.controls.amount.value,'ether')))
      }
    }catch(e){
      gasLimit = await this._web3.blockGas();
    }

    let dialogRef = this._dialog.openGasDialog(await gasLimit, 1);
    dialogRef.afterClosed().subscribe(async result=>{
      console.log("result",result);
      if(typeof(result) != 'undefined'){
        let obj = JSON.parse(result);

        if(typeof(form.controls.trans_data.value)!="undefined" && form.controls.trans_data.value != ""){
          obj.data = form.controls.trans_data.value;
        }
        tx =  await this._rawtx.createRaw(receiver, form.controls.amount.value, obj)
        this.sendDialogService.openConfirmSend(tx[0], receiver, tx[2],tx[1]-tx[2], tx[1], "send");
      }
    })
  }

  async getBip39(form){
    const bip39 = require('bip39');
    const hdkey = require('hdkey');
    const strength: number = 128;//number words 12
    const wordName = "english";//library words name
    
    const rng = null;  // Let module randombytes create this for us.
    const wordList = eval('bip39.wordlists.'+wordName);//o require del json
    
    const mnemonic = bip39.generateMnemonic(strength, rng, wordList);
    console.log("MNEMONIC", mnemonic)
    let seed = bip39.mnemonicToSeed(mnemonic);
    const isMnemonicValid = bip39.validateMnemonic(mnemonic, wordList);
    
    const hdwallet = hdkey.fromMasterSeed(seed);
    console.log(hdwallet)
    const privateKey= hdwallet.privateKey;

    let wallet = this._wallet.accountFromPrivatekey(privateKey);

    console.log(wallet.getAddressString());
    return wallet.getAddressString().toString();
  }

  sendSeed():void{

  }

}
