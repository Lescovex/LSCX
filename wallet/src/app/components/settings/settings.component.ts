import { Component, OnInit } from '@angular/core'
import { Web3 } from '../../services/web3.service';
import { EtherscanService } from '../../services/etherscan.service';
import { AccountService } from '../../services/account.service';

const shell = require('electron').shell;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  languages=[{lang:'en', text:"English"}]
  lang = 'en';
  infuraApiKey : string;
  etherscanApiKey: string;
  constructor(private _scan: EtherscanService, private _web3 : Web3, private _account: AccountService) {
    this.infuraApiKey= _web3.infuraKey;
    this.etherscanApiKey = _scan.apikey;
  }

  ngOnInit() {}

  setInfuraKey(text?){
    if(typeof(text)!= 'undefined'){
      this.infuraApiKey = text;
    }
    this._web3.setInfuraKey(this.infuraApiKey);
    this._web3.setNetwork(this._web3.network);
    if(this._scan.apikey != "" && this._web3.infuraKey != ""){
      this._account.getAccountData();
      if('address' in this._account.account){
        this._account.startIntervalData();
      }
    }
  }
  setEtherscanKey(text?){
    if(typeof(text)!= 'undefined'){
      this.etherscanApiKey = text;
    }
    this._scan.setApiKey(this.etherscanApiKey)
  }
  openUrl(url){
    shell.openExternal(url);
  }


}
