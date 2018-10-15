import { Component, OnInit } from '@angular/core'

import * as QRcode from 'qrcode';

import { AccountService } from '../../../services/account.service';
import { WalletService } from '../../../services/wallet.service';


@Component({
  selector: 'receive-page',
  templateUrl: './receive.html',
})
export class ReceivePage implements OnInit {
  constructor(private _account: AccountService, private _wallet: WalletService) {

  }

  ngOnInit() {
    
    QRcode.toCanvas(this._account.account.address , { errorCorrectionLevel: 'H' }, function (err, canvas) {
      let canvasCont = document.getElementById('canvas')
      canvasCont.appendChild(canvas)
    })
  }

  receive(form){
    
    const bip39 = require('bip39');
    const hdkey = require('hdkey');

    let seed = bip39.mnemonicToSeed(form.controls.seed.value);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const privateKey= hdwallet.privateKey;

    let wallet = this._wallet.accountFromPrivatekey(privateKey);
  }

}
