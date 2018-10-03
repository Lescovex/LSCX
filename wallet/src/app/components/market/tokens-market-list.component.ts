import { Component, Output, EventEmitter } from '@angular/core';

import { MarketService } from '../../services/market.service';
import { AccountService } from '../../services/account.service';
import { ContractService } from '../../services/contract.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { Web3 } from '../../services/web3.service';


@Component({
  selector: 'app-tokens-market-list',
  templateUrl: './tokens-market-list.component.html',
})
export class TokensMarketListComponent {
  @Output() show = new EventEmitter<boolean>();  
  tokens : any[] = [];
  LSCX_tokens: any[] = [];

  constructor(private _market: MarketService, private _account: AccountService, private _contract: ContractService, private _contractStorage: ContractStorageService, private _web3: Web3) {
    this.search()
  }

  search(input?){
    let tokens = this._market.config.tokens.filter(x=> x);
    tokens.sort((a, b)=> (a.name).localeCompare(b.name));

    let LCXcontracts: any[] =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network);
    let LSCX_tokens = [];
    LCXcontracts.forEach(contract =>{
      LSCX_tokens.push({ addr: contract.address, name: contract.symbol, decimals: contract.decimals }) ;
    })
    LSCX_tokens.sort((a, b)=> (a.name).localeCompare(b.name));

    /*if('tokens' in this._account){
      this._account.tokens.forEach(token=>{
        if(tokens.findIndex(tk=>tk.addr.toUpperCase()==token.contractAddress.toUpperCase())== -1
        && LSCX_tokens.findIndex(tk=>tk.addr.toUpperCase()==token.contractAddress.toUpperCase())== -1){
          let tokenP = { addr: token.contractAddress, name: token.tokenSymbol, decimals: token.tokenDecimal }
          tokens.push(tokenP);
        };
      })
    }*/
    if(typeof(input)!="undefined"){
      tokens = tokens.filter(token=> {
        if('name' in token && token.name != ""){
          return token.name.toUpperCase().startsWith(input.toUpperCase())
        }
      });
      LSCX_tokens = LSCX_tokens.filter(token=> {
        if('name' in token && token.name != ""){
          token.name.toUpperCase().startsWith(input.toUpperCase())
        }
      });
    }
    this.tokens =  tokens;
    this.LSCX_tokens = LSCX_tokens;
  }
  
  selectToken(token){
    //console.log("cons",token)
    this._market.resetSocket(token);
    this.show.emit(false);
    
  }
}
