import { Component, DoCheck, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service';
import { ContractService } from '../../../services/contract.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { MarketComponent } from "../market.component";
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { Order } from '../../../models/order';
import { ZeroExService } from "../../../services/0x.service";

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

  constructor(public _zeroEx:ZeroExService,protected _account: AccountService, private _contract: ContractService, public _LSCXmarket: LSCXMarketService, private _dialog: DialogService, private _web3: Web3) {
    if(this._zeroEx.display == 'eth'){
      this._LSCXmarket.activateLoading();
    }
    
    this._LSCXmarket.getTokenState();
    this.action = "myOrders";
    this.intervalLoops = 0;
    this.lastAction = "myOrders";
    this.getHistory(this.action);
    this.currentState = this._LSCXmarket.state.myOrders;
    this.currentToken = this._LSCXmarket.token.name; 
    this._LSCXmarket.setBalances()
  }

  ngOnInit(){
    
  }
  async ngDoCheck() {
    
    if(this.lastAction != this.action){
      this.lastAction = this.action;
    }
    if(this.currentToken != this._LSCXmarket.token.name){
      this.currentToken = this._LSCXmarket.token.name;
      Promise.resolve().then(() => { this.activeButton(this.action)});
    }

    if(JSON.stringify(this.currentState) != JSON.stringify(this._LSCXmarket.state[this.action]) && this.lastAction == this.action) {
      this.lastAction = this.action;
      this.currentState = this._LSCXmarket.state[this.action];
      this.getHistory(this.action);
    }
  }

  activeButton(action){
    if(action != "myOrders"){
      this.loadingDialog = this._dialog.openLoadingDialog();
    }
    this.intervalLoops = 0;
    let interval = setInterval(()=>{
      this.intervalLoops++;
      this.getHistory(action);
      this.action = action;
      if (this.loadingDialog != null) {
          this.loadingDialog.close();
          this.loadingDialog= null;
      }
      clearInterval(interval);
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
    let trades = this._LSCXmarket.state.myTrades.filter(x=> x.show);;
    return (typeof(trades) == 'undefined')? [] : trades;
  }

  getMyOrders(): any[] {
    let buyOrders = this._LSCXmarket.state.orders.buys.filter(x=> !x.deleted && x.show);
    let sellOrders = this._LSCXmarket.state.orders.sells.filter(x=> !x.deleted && x.show);
    
    let orders =  this._LSCXmarket.state.myOrders.filter(x=> !x.deleted && x.show);
    
    let myOrders: Order[] =[];
    orders.map(order => {
      myOrders.push(new Order(order, order.tokenDecimals));  
    });
    myOrders.sort((a,b)=>{
      return a.price - b.price || parseInt(a.amountGet.toString()) -  parseInt(b.amountGet.toString());
    })
    
    return myOrders;
  }

  getMyFunds(): any[] {
    let funds = this._LSCXmarket.state.myFunds.filter(fund=>fund.show);
    return (typeof(funds) == 'undefined')? [] : funds;
  }

  openExternal(txHash){
    const shell = require('electron').shell;
    let net : string;
    switch(this._web3.network) {
      case 1: 
        net ="";
        break;
      case 3: 
        net ="ropsten.";
        break;
      case 42: 
        net ="";
        break;
    }
    shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
}
}
