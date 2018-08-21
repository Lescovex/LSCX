import { Component, OnInit } from '@angular/core'
declare var require: any;

import { AccountService } from '../../../services/account.service';


@Component({
  selector: 'global-page',
  templateUrl: './global.html'
})
export class GlobalPage implements OnInit {
  constructor(protected _account: AccountService) {
    // console.log('SendPage')
  }

  ngOnInit() {
    // console.log("Inited, ", devp2p)
  }


}
