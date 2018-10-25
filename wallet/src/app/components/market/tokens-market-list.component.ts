import { Component, Output, EventEmitter } from '@angular/core';

import { LSCXMarketService } from '../../services/LSCX-market.service';


@Component({
  selector: 'app-tokens-market-list',
  templateUrl: './tokens-market-list.component.html',
})
export class TokensMarketListComponent {
  @Output() show = new EventEmitter<boolean>();  
  tokens : any[] = [];
  LSCX_tokens: any[] = [];

  constructor(private _LSCXmarket: LSCXMarketService) {
    this.search()
  }

  search(input?){
    let tokens = this._LSCXmarket.config.tokens.filter(x=> x.name!="ETH");
    tokens.sort((a, b)=> (a.name).localeCompare(b.name));
    let LSCX_tokens = this._LSCXmarket.marketState.tikers.filter(x=>x);

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
    this.tokens =  tokens;
    this.LSCX_tokens = LSCX_tokens;
  }
  
  async selectToken(token){
    /*let balancesIntervalActive = (this._LSCXmarket.balancesInterval == null)? false : true;
    let ordersIntervalActive = (this._LSCXmarket.stateOrdersInteval == null)? false : true;
    let tikersIntervalActive = (this._LSCXmarket.tikersInterval == null)? false : true
    this._LSCXmarket.clearBalancesInterval();
    this._LSCXmarket.clearStateOrdersInterval();
    this._LSCXmarket.clearTikersInterval();*/
    await this._LSCXmarket.setToken(token);
    /*if(balancesIntervalActive) {
      this._LSCXmarket.setBalancesInterval();
    }
    if(ordersIntervalActive) {
      this._LSCXmarket.setStateOrdersInterval();
    }
    if(tikersIntervalActive) {
      this._LSCXmarket.setTikersInterval();
    }*/
    this.show.emit(false);
    
  }
}
