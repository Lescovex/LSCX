import { Component, OnInit, OnDestroy } from '@angular/core'

import { AccountService } from '../../../services/account.service'
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { EtherscanService } from '../../../services/etherscan.service';

@Component({
  selector: 'app-market-wallet',
  templateUrl: './market-wallet.page.html',
})
export class MarketWalletPage implements OnInit, OnDestroy {
  action : string;
  interval;
  constructor(public _account:AccountService, protected _LSCXmarket: LSCXMarketService, private _scan: EtherscanService ) {
    this.action = 'deposit';
  }
  async ngOnInit() {
    await this._LSCXmarket.setBalancesInterval();
  }

  ngOnDestroy(){
    this._LSCXmarket.clearBalancesInterval();
  }

  activeButton(action){
    this.action = action;
  }
  openExternal(){
    this._scan.openTokenUrl(this._LSCXmarket.token.addr)
  }
}
