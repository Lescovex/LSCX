import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';
import { Web3 } from '../../../services/web3.service';


@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class GeneralPage implements OnInit, OnDestroy, DoCheck {
  interval;
  tokens:  any[];
  hideZero: boolean;
  allTokens: any[];
  constructor(protected _account: AccountService, private _token: TokenService, private _web3: Web3) {
    this.hideZero = false;
    this.allTokens = this._account.account.tokens.filter(x=>x);
  }

  ngOnInit() {
    this.setTokens();
    this.interval = this._account.startIntervalTokens();
  }

  ngOnDestroy(){
    clearInterval(this.interval)
  }

  ngDoCheck() {
    if(JSON.stringify(this.allTokens) != JSON.stringify(this._account.account.tokens)){
      this.setTokens();
      this.allTokens = this._account.account.tokens.filter(x=>x);
    }
  }

  openExternal(txHash){
    const shell = require('electron').shell;
    let net = (this._web3.network == 1) ? "" : "ropsten.";
    shell.openExternal('https://'+net+'etherscan.io/token/'+txHash+'?a='+this._account.account.address);
  }

  setTokens() {
    if(!this.hideZero){
      this.tokens =  this._account.account.tokens.filter(token => !token.deleted);
    }else{
      this.tokens = this._account.account.tokens.filter(token => token.balance > 0 && !token.deleted);
    }
  }
  
  toggleHideZero(){
    this.hideZero = !this.hideZero;
    this.setTokens();
  }
}