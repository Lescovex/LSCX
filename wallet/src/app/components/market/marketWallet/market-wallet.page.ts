import { Component, OnInit, OnDestroy } from '@angular/core'

import { AccountService } from '../../../services/account.service'
import { MarketService } from '../../../services/market.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';

@Component({
  selector: 'app-market-wallet',
  templateUrl: './market-wallet.page.html',
})
export class MarketWalletPage implements OnInit, OnDestroy {
  action : string;
  interval;
  constructor(public _account:AccountService, protected _LSCXmarket: LSCXMarketService ) {
    this.action = 'deposit';
  }
  async ngOnInit() {
    this.interval = await this._LSCXmarket.balancesInterval();
  }
  ngOnDestroy(){
    clearInterval(this.interval)
  }
  activeButton(action){
    this.action = action;
  }
}
