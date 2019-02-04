import { Component, Output, EventEmitter, OnChanges } from '@angular/core';

import { LSCXMarketService } from '../../services/LSCX-market.service';
import { ZeroExService } from "../../services/0x.service";

@Component({
  selector: 'app-tokens-market-list',
  templateUrl: './tokens-market-list.component.html',
})
export class TokensMarketListComponent implements OnChanges {
  @Output() show = new EventEmitter<boolean>();  
  tokens : any[] = [];
  display;
  constructor(public _LSCXmarket: LSCXMarketService, public _zeroEx: ZeroExService) {
    this.search()
  }

  ngOnInit(){
    
  }
  ngOnChanges(): void{
    if(this.display != this._zeroEx.display){
        this.display = this._zeroEx.display;
        this.search();
    }
}

  search(input?){
    if(this._zeroEx.display == 'eth'){
      let tokens = this._LSCXmarket.config.tokens.filter(x=> x.name!="ETH");
      let LSCX_tokens = this._LSCXmarket.marketState.tikers.filter(x=>x);
      tokens = tokens.concat(LSCX_tokens);
      tokens.sort((a, b)=> (a.name).localeCompare(b.name));
      if(typeof(input)!="undefined"){
        tokens = tokens.filter(token=> {
          if('name' in token && typeof(token.name)!="undefined" && token.name != ""){
            return token.name.toUpperCase().startsWith(input.toUpperCase())
          }
        });
      }
      this.tokens =  tokens; 
    }
    if(this._zeroEx.display == 'weth'){
      let tokens = this._zeroEx.asset_pairs;
      tokens.sort((a, b)=> (a.reverseName).localeCompare(b.reverseName));
      if(typeof(input)!="undefined"){
        tokens = tokens.filter(token=> {
          if('name' in token && typeof(token.reverseName)!="undefined" && token.reverseName != ""){
            return token.reverseName.toUpperCase().startsWith(input.toUpperCase())
          }
        });
      }
      this.tokens =  tokens;
    }
    
  }
  
  async selectToken(token){
    if(this._zeroEx.display == 'eth'){
      await this._LSCXmarket.activateLoading();
      await this._LSCXmarket.setToken(token);
      this.show.emit(false);
    }
    if(this._zeroEx.display == 'weth'){
      await this._zeroEx.setToken(token);
      this.show.emit(false);
    }
  }
  
}
