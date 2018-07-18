import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

/*Services*/
import { AccountService } from '../../../account.service'
import { TokenService } from '../../../token.service';

import * as EthUtil from 'ethereumjs-util';


@Component({
  selector: 'add-token-page',
  templateUrl: './add.html'
})

export class AddTokenPage implements OnInit {
  token:any = {}
  isToken = false;

  constructor(protected _account: AccountService, private _token: TokenService, private router: Router) {
    // console.log('SendPage')
  }

  ngOnInit() {
    // console.log("Inited, ", devp2p)
  }
  async setTokenInfo(){
    let error= false;
    if(EthUtil.isValidAddress(this.token.contractAddress)){
      this._token.setToken(this.token.contractAddress);
      try{
        this.token.tokenSymbol = await this._token.getSymbol();
      }catch(e){
        console.log(e)
        error = true;
      }
      if(!error){
        console.log("sin erro")
        this.token.tokenDecimal = await this._token.getDecimal();
        this.token.tokenName = await this._token.getName();
        this.token = await this._account.updateTokenBalance(this.token)
        this.isToken = true;
      }    
      
    }
  }

  addToken(){
    if(this.isToken){
      console.log(this.token.tokenSymbol,this.token.tokenDecimal,this._token.token )
      this._account.addToken(this.token),
      this.reset();
      this.router.navigate(['/tokens/general']);
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


