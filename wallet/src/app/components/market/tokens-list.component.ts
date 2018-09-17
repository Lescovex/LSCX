import { Component, Output, EventEmitter } from '@angular/core';

import { MarketService } from '../../services/market.service';
import { AccountService } from '../../services/account.service';
import { ContractService } from '../../services/contract.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { Web3 } from '../../services/web3.service';


@Component({
  selector: 'app-tokens-list',
  templateUrl: './tokens-list.component.html',
})
export class TokensListComponent {
  @Output() show = new EventEmitter<boolean>();  
  tokens : any[] = [];

  constructor(private _market: MarketService, private _account: AccountService, private _contract: ContractService, private _contractStorage: ContractStorageService, private _web3: Web3) {
    this.search()
  }

  search(input?){
    let tokens = this._market.config.tokens.filter(x=> x);
    tokens.sort((a, b)=> (a.name).localeCompare(b.name));
    let LCXcontracts: any[] =  this._contractStorage.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network);
    /*LCXcontracts.forEach(contract =>{
      if(tokens.findIndex(tk=>tk.addr.toUpperCase() == contract.address.toUpperCase())== -1){
        let tokenP = { addr: contract.address, name: contract.symbol, decimals: contract.decimals };
        tokens.push(tokenP);
      }
    })*/
    /*if('tokens' in this._account.account){
      this._account.account.tokens.forEach(token=>{
        if(tokens.findIndex(tk=>tk.addr.toUpperCase()==token.contractAddress.toUpperCase())== -1){
          let tokenP = { addr: token.contractAddress, name: token.tokenSymbol, decimals: token.tokenDecimal }
          tokens.push(tokenP);
        }
      })
    }*/
    if(typeof(input)!="undefined"){
      tokens = tokens.filter(token=> token.name.toUpperCase().startsWith(input.toUpperCase()))
    }
    this.tokens =  tokens;
  }
  
  selectToken(token){
    //console.log("cons",token)
    this._market.resetSocket(token);
    this.show.emit(false);
    
  }
}
