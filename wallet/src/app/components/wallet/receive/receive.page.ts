import { Component, OnInit } from '@angular/core'

// import * as devp2p from 'ethereumjs-devp2p'
declare var require: any;
import * as QRcode from 'qrcode';

import { AccountService } from '../../../services/account.service';



@Component({
  selector: 'receive-page',
  templateUrl: './receive.html',
})
export class ReceivePage implements OnInit {
  constructor(private _account: AccountService,) {

  }

  ngOnInit() {
    // console.log("Inited, ", devp2p)
    QRcode.toCanvas(this._account.account.address , { errorCorrectionLevel: 'H' }, function (err, canvas) {
      let canvasCont = document.getElementById('canvas')
      canvasCont.appendChild(canvas)
    })
  }

}
