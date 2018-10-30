import { Component, OnDestroy, DoCheck } from '@angular/core';

import { AccountService } from '../../services/account.service';
import { LSCXMarketService } from '../../services/LSCX-market.service';
import { Web3 } from '../../services/web3.service';


@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
})
export class MarketComponent implements DoCheck, OnDestroy{
  protected showList: boolean = false;
  protected price;
  interval;
  constructor(public _account:AccountService, protected _LSCXmarket: LSCXMarketService, private _web3: Web3) {
    this._LSCXmarket.updateMyStateShow("myFunds");
    this._LSCXmarket.updateMyStateShow("myOrders");
    this._LSCXmarket.updateMyStateShow("myTrades");
    this._LSCXmarket.setTikersInterval();
  }

  ngDoCheck(){
     if(this._LSCXmarket.updated = true && this._LSCXmarket.tikersInterval == null){
       this._LSCXmarket.setTikersInterval();
     }
  }
  
  ngOnDestroy(){
    this._LSCXmarket.clearTikersInterval();
  }

  maxHeight() {
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }

  toggleList() {
    this.showList = !this.showList
  }

  onSelect(show:boolean) {
    this.showList = show;
    this.price = 0;
  }

  toggleShow() {
    this.showList = ! this.showList;
  }

  set
}
