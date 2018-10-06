import { Component, OnInit, DoCheck } from '@angular/core'
import { Web3 } from '../../services/web3.service';
import { EtherscanService } from '../../services/etherscan.service';
import { AccountService } from '../../services/account.service';
import { DialogService } from '../../services/dialog.service';

const shell = require('electron').shell;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit, DoCheck{
  languages=[{lang:'en', text:"English"}]
  lang = 'en';
  infuraApiKey : string;
  showErrorDialog = false;
  etherscanApiKey: string;
  constructor(private _scan: EtherscanService, private _web3 : Web3, private _account: AccountService, private _dialog: DialogService) {
    this.infuraApiKey= (_web3.infuraKey=="")? null : _web3.infuraKey;
    this.etherscanApiKey = (_scan.apikey=="")? null: _scan.apikey;
  }


  ngOnInit() {
    if(this.infuraApiKey== null || this.etherscanApiKey==null){
      Promise.resolve().then(()=>{
        this._dialog.openApiKeysMessage('init');
      })
    }
  }
  
  ngDoCheck() {
    if((this.infuraApiKey== "" || this.etherscanApiKey== "") && this.showErrorDialog){
      Promise.resolve().then(()=>{
        this.showErrorDialog = false;
        let dialogRef = this._dialog.openApiKeysMessage('error');    
      })
    }

  }

  setInfuraKey(text?){
    if(typeof(text)!= 'undefined'){
      this.infuraApiKey = text;
    }else{
      this.setShowTrue();
      
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
    }else{
      this.setShowTrue();
      
    }
    this._scan.setApiKey(this.etherscanApiKey)
  }

  setShowTrue() {
    if(this.infuraApiKey!= "" && this.etherscanApiKey!="") {
      this.showErrorDialog = true;
    }
  }
  openUrl(url){
    shell.openExternal(url);
  }


}
