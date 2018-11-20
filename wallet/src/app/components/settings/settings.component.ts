import { Component, OnInit, DoCheck } from '@angular/core'
import { Web3 } from '../../services/web3.service';
import { EtherscanService } from '../../services/etherscan.service';
import { AccountService } from '../../services/account.service';
import { DialogService } from '../../services/dialog.service';
import { Router } from '@angular/router';

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
  defaultApiMessage;
  constructor(private _scan: EtherscanService, private _account: AccountService, private _dialog: DialogService, private router: Router) {
    this.etherscanApiKey = (_scan.apikey=="" || _scan.apikey == _scan.defaultApikey)? null: _scan.apikey;
    
  }


  ngOnInit() {
    if(this.etherscanApiKey == null){
      Promise.resolve().then(()=>{
        this._dialog.openApiKeysMessage('init');
      })
    }
    if(this.etherscanApiKey == "JDVE27WHYITCKM7Q2DMBC3N65VDIZ74HHJ" || this.etherscanApiKey == null){
      this.defaultApiMessage = true;
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
    this._scan.setApiKey(this.etherscanApiKey);
    if(this.etherscanApiKey == "JDVE27WHYITCKM7Q2DMBC3N65VDIZ74HHJ"){
      this.defaultApiMessage = true;
    }else{
      this.defaultApiMessage = null;
    }
  }

  setShowTrue() {
    if(this.etherscanApiKey!="") {
      this.showErrorDialog = true;
    }
  }

  openUrl(url){
    shell.openExternal(url);
  }

  accept(){
    if(this.etherscanApiKey != null && this.etherscanApiKey != ""){
      this.router.navigate(['/wallet/global']);
    }else{
      return false;
    }
  }
}
