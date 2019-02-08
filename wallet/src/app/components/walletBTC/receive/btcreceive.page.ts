import { Component, OnInit } from '@angular/core'
import { BitcoinAccountService } from '../../../services/account-bitcoin.service';

import { MdSnackBar } from '@angular/material';
import * as QRcode from 'qrcode';

@Component({
  selector: 'btcsreceive-page',
  templateUrl: './btcreceive.html',
})

export class BitcoinReceivePage implements OnInit {
  err;
  constructor(public snackBar: MdSnackBar,protected _account: BitcoinAccountService) {
    
  }

  async ngOnInit() {
  
    QRcode.toCanvas(this._account.account.address , { errorCorrectionLevel: 'H' }, function (err, canvas) {
      let canvasCont = document.getElementById('canvas')
      canvasCont.appendChild(canvas)
    });
  }

  copyClipBoard(){
    var inp =document.createElement('input');
    document.body.appendChild(inp)
    inp.value = this._account.account.address;
    inp.select();
    document.execCommand('copy',false);
    inp.remove()
    this.openSnackBar();
  }

  openSnackBar() {
    this.snackBar.open("Your address " +this._account.account.address + " has been copied to the clipboard.", "Close", {
      duration: 2000,
    });
  }
}
