import { Component } from '@angular/core';

import { AccountService } from '../../services/account.service';
import { MarketService } from '../../services/market.service';


@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
})
export class MarketComponent{
  protected showList: boolean = false;
  interval;
  constructor(public _account:AccountService, private _market: MarketService) {
  }

  maxHeight() {
    var mainContent = document.getElementsByClassName('main-content')[0];
    return mainContent.getBoundingClientRect().height-110;
  }
  toggleList() {
    this.showList = !this.showList
  }
  onSelect(show:boolean) {
    this.showList = show
  }
  toggleShow() {
    this.showList = ! this.showList;
  }
}
