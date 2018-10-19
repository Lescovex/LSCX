import { Component } from '@angular/core';

import { AccountService } from '../../services/account.service';
import { LSCXMarketService } from '../../services/LSCX-market.service';


@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
})
export class MarketComponent{
  protected showList: boolean = false;
  protected price;
  interval;
  constructor(public _account:AccountService, protected _LSCXmarket: LSCXMarketService) {
    this._LSCXmarket.updateFunds();
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
}
