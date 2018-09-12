import { Component, OnInit } from '@angular/core'
import { Web3 } from '../../services/web3.service';
import { EtherscanService } from '../../services/etherscan.service';


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
    this._web3.setProvider();
  }
  setEtherscanKey(){
    this._scan.setApiKey(this.etherscanApiKey)
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
