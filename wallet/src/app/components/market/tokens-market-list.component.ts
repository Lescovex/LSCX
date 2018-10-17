import { Component, Output, EventEmitter } from '@angular/core';

import { MarketService } from '../../services/market.service';
import { AccountService } from '../../services/account.service';
import { ContractService } from '../../services/contract.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { Web3 } from '../../services/web3.service';
import { LSCXMarketService } from '../../services/LSCX-market.service';


@Component({
  selector: 'app-tokens-market-list',
  templateUrl: './tokens-market-list.component.html',
})
export class TokensMarketListComponent {
  @Output() show = new EventEmitter<boolean>();  
  tokens : any[] = [];
  LSCX_tokens: any[] = [];

  constructor(private _LSCXmarket: LSCXMarketService, private _account: AccountService, private _contract: ContractService, private _contractStorage: ContractStorageService, private _web3: Web3) {
    this.search()
  }

  search(input?){
    let tokens = this._LSCXmarket.config.tokens.filter(x=> x);
    tokens.sort((a, b)=> (a.name).localeCompare(b.name));
    
    let LSCXcontracts: any[] =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network.chain);
    console.log(this._contractStorage.contracts, LSCXcontracts);
    let LSCX_tokens = [];
    LSCXcontracts.forEach(contract =>{
      LSCX_tokens.push({ addr: contract.address, name: contract.symbol, decimals: contract.decimals }) ;
    })
    LSCX_tokens.sort((a, b)=> (a.name).localeCompare(b.name));
    if(typeof(input)!="undefined"){
      tokens = tokens.filter(token=> {
        if('name' in token && typeof(token.name)!="undefined" && token.name != ""){
          return token.name.toUpperCase().startsWith(input.toUpperCase())
        }
      });
      LSCX_tokens = LSCX_tokens.filter(token=> {
        if('name' in token && typeof(token.name)!="undefined" && token.name != ""){
          token.name.toUpperCase().startsWith(input.toUpperCase())
        }
      });
    }
    console.log(tokens);
    this.tokens =  tokens;
    this.LSCX_tokens = LSCX_tokens;
  }
  
  selectToken(token){    
    this._LSCXmarket.setToken(token);
    //this._LSCXmarket.resetSocket(token);
    this.show.emit(false);
    
  }
}
