import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';
import { DialogService } from '../../../services/dialog.service';

import * as EthUtil from 'ethereumjs-util';


@Component({
  selector: 'add-token-page',
  templateUrl: './add.html'
})

export class AddTokenPage implements OnInit {
  token:any = {}
  isToken = false;

  constructor(protected _account: AccountService, private _token: TokenService, private router: Router, private _dialog: DialogService) {
    
  }

  ngOnInit() {
    
  }
  async setTokenInfo(){
    let error= false;
    if(EthUtil.isValidAddress(this.token.contractAddress)){
      this._token.setToken(this.token.contractAddress);
      try{
        this.token.tokenSymbol = await this._token.getSymbol();
      }catch(e){
        
        error = true;
      }
      if(!error){
        
        this.token.tokenDecimal = await this._token.getDecimal();
        this.token.tokenName = await this._token.getName();
        this.token = await this._account.updateTokenBalance(this.token)
        this.isToken = true;
      }    
      
    }
  }

  addToken(){
    let tokenIndex = this._account.tokens.findIndex(token => token.contractAddress.toLowerCase() == this.token.contractAddress.toLowerCase())
    if(tokenIndex != -1 && !this._account.tokens[tokenIndex].deleted){
        let title = 'Unable to add token';
        let message = 'Something was wrong';
        let error = 'The token you are trying to import is a duplicate'
        let dialogRef = this._dialog.openErrorDialog(title, message, error)
        
    } else if(tokenIndex != -1 && this._account.tokens[tokenIndex].deleted) {
      this._account.tokens[tokenIndex].deleted = false;
      this.router.navigate(['/tokens/general']);
    } else {
      if(this.isToken){
        this._account.addToken(this.token),
        this.router.navigate(['/tokens/general']);
      }
    }
  }

  reset(){
    this.token = {
      contractAddress : "",
      tokenSymbol : "",
      tokenDecimal : 18,
      tokenName : '',
      tokenBalance: 0
    }
    this.isToken=false;
    
  }
}

