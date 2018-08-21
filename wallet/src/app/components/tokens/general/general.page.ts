import { Component, OnInit, OnDestroy } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';


@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class GeneralPage implements OnInit, OnDestroy {
  interval;

  constructor(protected _account: AccountService, private _token: TokenService) {
    // console.log('SendPage')
  }

  ngOnInit() {
    this.interval = this._account.startIntervalTokens();
  }

  openExternal(txHash){
    const shell = require('electron').shell;
    shell.openExternal('https://ropsten.etherscan.io/token/'+txHash+'?a='+this._account.account.address);
  }

  ngOnDestroy(){
    clearInterval(this.interval)
  }
}