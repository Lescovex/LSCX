import { Component, OnInit } from '@angular/core'
import { AccountService } from '../../services/account.service';
import { Web3 } from '../../services/web3.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  languages=[{lang:'en', text:"English"}]
  lang = 'en';
  infuraApiKey : string;
  etherscanApiKey: string;
  constructor(private _account: AccountService, private _web3 : Web3) {
    this.infuraApiKey= _web3.infuraKey;
    this.etherscanApiKey = _account.apikey;
  }

  ngOnInit() {}

  setInfuraKey(){
    this._web3.setInfuraKey(this.infuraApiKey);
    this._web3.setProvider(3);
  }
  setEtherscanKey(){
    this._account.setApiKey(this.etherscanApiKey)
  }
  openUrl(website){
    const shell = require('electron').shell;
    let url;
    if(website=='infura'){
      url='https://infura.io/register';
    }else{
      url='https://ropsten.etherscan.io/apis'
    }
        shell.openExternal(url);
  }

}
