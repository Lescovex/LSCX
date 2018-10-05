import { Component, DoCheck } from '@angular/core'

import { AccountService } from '../../../services/account.service';
import { ContractService } from '../../../services/contract.service';
import { MarketService } from '../../../services/market.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';


@Component({
  selector: 'market-history-page',
  templateUrl: './market-history.page.html'
})
export class MarketHistoryPage implements DoCheck {
  action: string;
  lastAction: string;
  history: any[] = [];
  currentToken: any;
  currentState:any;
  loadingDialog;
  intervalLoops:number;

  constructor(protected _account: AccountService, private _contract: ContractService, private _market: MarketService, private _dialog: DialogService, private _web3: Web3) {
    this.action = "myTrades";
    this.intervalLoops = 0;
    this.lastAction = "myTrades";
    this.getHistory(this.action);
    this.currentState = this._market.state.myTrades;
    this.currentToken = this._market.token.name; 
  }

  async ngDoCheck() {
    if(this.currentToken != this._market.token.name){
      this.currentToken = this._market.token.name;
      Promise.resolve().then(() => { this.activeButton(this.action)});
    }

    if(JSON.stringify(this.currentState) != JSON.stringify(this._market.state[this.action]) && this.lastAction == this.action) {
      this.lastAction = this.action;
      this.currentState = this._market.state[this.action];
      this.getHistory(this.action);
    }
  }

  activeButton(action){
    this.loadingDialog = this._dialog.openLoadingDialog();
    this.intervalLoops = 0;
    let interval = setInterval(()=>{
      this.intervalLoops++;
      if(this._market.state.initialState == true){
        this.intervalLoops = 0;
        this.getHistory(action);
        this.action = action;
        if (this.loadingDialog != null) {
          this.loadingDialog.close();
        }
        clearInterval(interval);
      }
      if(this.intervalLoops>40){
        if (this.loadingDialog != null) {
          this.loadingDialog.close();
          this.loadingDialog = null;
        }
      }
    },500)
  }

  getHistory(action) {
    switch(action){
      case "myTrades":
        this.history = this.getMyTrades();
        break;
      case "myOrders":
        this.history = this.getMyOrders();
        break;
      case "myFunds":
        this.history = this.getMyFunds();
        break;
    }
  }

  getMyTrades(): any[] {
    let trades = this._market.state.myTrades;
    return (typeof(trades) == 'undefined')? [] : trades;
  }

  getMyOrders(): any[] {
    let marketOrders =  this._market.state.myOrders;
    let buys = (typeof(marketOrders)=="undefined")? [] : marketOrders.buys;
    let sells = (typeof(marketOrders)=="undefined")? [] : marketOrders.sells;
    let orders = buys;
    orders.concat(sells);
    orders.sort((a,b)=>{
      return a.price - b.price || a.amountGet - b.amountGet
    })
    return orders;
  }

  getMyFunds(): any[] {
    let funds = this._market.state.myFunds;
    return (typeof(funds) == 'undefined')? [] : funds;
  }

  openExternal(txHash){
    const shell = require('electron').shell;
    let net = (this._web3.network==1) ? "":"ropsten.";
    shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
}
}
