import { Component, OnInit, OnDestroy } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';
import { Web3 } from '../../../services/web3.service';


@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class GeneralPage implements OnInit, OnDestroy {
  interval;

  constructor(protected _account: AccountService, private _token: TokenService, private _web3: Web3) {
    // console.log('SendPage')
  }

  ngOnInit() {
    this.interval = this._account.startIntervalTokens();
  }

  openExternal(txHash){
    const shell = require('electron').shell;
    let net = (this._web3.network == 1) ? "" : "ropsten.";
    shell.openExternal('https://'+net+'etherscan.io/token/'+txHash+'?a='+this._account.account.address);
  }

  ngOnDestroy(){
    clearInterval(this.interval)
  }
}