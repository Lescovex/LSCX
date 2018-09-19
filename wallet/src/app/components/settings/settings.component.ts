import { Component, OnInit } from '@angular/core'
import { Web3 } from '../../services/web3.service';
import { EtherscanService } from '../../services/etherscan.service';

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
  constructor(private _scan: EtherscanService, private _web3 : Web3) {
    this.infuraApiKey= _web3.infuraKey;
    this.etherscanApiKey = _scan.apikey;
  }

  ngOnInit() {}

  setInfuraKey(){
    this._web3.setInfuraKey(this.infuraApiKey);
    this._web3.setNetwork(this._web3.network);
  }
  setEtherscanKey(){
    this._scan.setApiKey(this.etherscanApiKey)
  }
  openUrl(url){
    shell.openExternal(url);
  }


}
