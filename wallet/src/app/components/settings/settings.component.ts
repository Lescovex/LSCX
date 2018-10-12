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
  showErrorDialog = false;
  etherscanApiKey: string;
  constructor(private _scan: EtherscanService, private _account: AccountService, private _dialog: DialogService) {
    this.etherscanApiKey = (_scan.apikey=="")? null: _scan.apikey;
  }


  ngOnInit() {
    if(this.etherscanApiKey==null){
      Promise.resolve().then(()=>{
        this._dialog.openApiKeysMessage('init');
      })
    }
  }

  ngDoCheck() {
    if(this.etherscanApiKey== "" && this.showErrorDialog){
      Promise.resolve().then(()=>{
        this.showErrorDialog = false;
        let dialogRef = this._dialog.openApiKeysMessage('error');    
      });
    }
  }

  setEtherscanKey(){
    if(this.etherscanApiKey == ""){
      this.setShowTrue();  
    }  
    this._scan.setApiKey(this.etherscanApiKey)
  }

  setShowTrue() {
    if(this.etherscanApiKey!="") {
      this.showErrorDialog = true;
    }
  }

  openUrl(url){
    shell.openExternal(url);
  }
}
