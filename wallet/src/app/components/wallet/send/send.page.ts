import { Component, OnInit } from '@angular/core'
import { Http } from '@angular/http';

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
  public prefixes:any[];s 
  protected sendTo: string;
  public country: any;
  public submited:boolean;
  public showPrefixes:boolean;

  constructor(private http: Http, private _web3: Web3,private _account: AccountService, private _wallet: WalletService, private _dialog: DialogService, private sendDialogService: SendDialogService,  private _rawtx: RawTxService) {
    this.sendTo = "address";
    this.prefixes = require('../../../../assets/json/phonePrefixes.json');
    this.showPrefixes =false;
    this.submited =false;
    this.prefixes.map(x=> x.flag = x.code.toLowerCase()+".svg");  
  }

  async ngOnInit() {
    let ipResponse = await this.http.get("https://ipinfo.io").map(res => res.json()).toPromise();
    let code = ipResponse.country;
    this.country = this.prefixes.find(x=> x.code == code);
    
  }
  toggleShow(){
    this.showPrefixes = !this.showPrefixes;
}

  async sendEth(form) {
    this.submited = true;
    
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
        
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, this._web3.web3.toHex(form.controls.trans_data.value), parseInt(this._web3.web3.toWei(form.controls.amount.value,'ether')));
      } else {
        
        gasLimit = await this._web3.estimateGas(this._account.account.address, receiver, "", parseInt(this._web3.web3.toWei(form.controls.amount.value,'ether')))
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
    
    let seed = bip39.mnemonicToSeed(mnemonic);
    const isMnemonicValid = bip39.validateMnemonic(mnemonic, wordList);
    
    const hdwallet = hdkey.fromMasterSeed(seed);
    
    const privateKey= hdwallet.privateKey;

    let wallet = this._wallet.accountFromPrivatekey(privateKey);

    
    return wallet.getAddressString().toString();
  }

  sendSeed():void{

  }

}
