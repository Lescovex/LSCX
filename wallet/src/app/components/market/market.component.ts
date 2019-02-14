import { Component, OnDestroy, DoCheck } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { LSCXMarketService } from '../../services/LSCX-market.service';
import { Web3 } from '../../services/web3.service';

import { ZeroExService } from "../../services/0x.service";
import { EtherscanService } from "../../services/etherscan.service";

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
})
export class MarketComponent implements DoCheck, OnDestroy{
  protected showList: boolean = false;
  protected price;
  protected interval;
  protected net;
  public display;

  constructor(public _account:AccountService, public _LSCXmarket: LSCXMarketService, private _web3: Web3, public _zeroEx: ZeroExService, public _scan: EtherscanService) {
    this.display = "weth";
    this._zeroEx.display = this.display;
    this._LSCXmarket.updateMyStateShow("myFunds");
    this._LSCXmarket.updateMyStateShow("myOrders");
    this._LSCXmarket.updateMyStateShow("myTrades");
    this._LSCXmarket.setTikersInterval();
    this.net = this._web3.network.chain;
  }


  ngOnInit(){
    
  }

  ngDoCheck(){
    this._zeroEx.display = this.display;
    
     if(this._LSCXmarket.updated = true && this._LSCXmarket.tikersInterval == null){
       this._LSCXmarket.setTikersInterval();
     }
     if(this._zeroEx.interval == null && this._zeroEx.interval2 == null  && this._zeroEx.loaded != null){
      this._zeroEx.startIntervalBalance();
      this._zeroEx.orderWatcherInterval();
     }
     if(this.net != this._web3.network.chain){
     
        this.net = this._web3.network.chain;
     }
     
  }
  
  ngOnDestroy(){
    this._LSCXmarket.clearTikersInterval();
    this._zeroEx.clearBalancesInterval();
    this._zeroEx.clearInterval2();
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

  changeDisplay(){
    if(this.display == "eth"){
      this.display = "weth";
      this._zeroEx.display = this.display;
    }else{
      this.display = "eth";
      this._zeroEx.display = this.display;
    }
  }
  openExternal(){
    if(this._zeroEx.display == 'eth'){
      this._scan.openTokenUrl(this._LSCXmarket.token.addr)
    }
    if(this._zeroEx.display == 'weth'){
      this._scan.openTokenUrl(this._zeroEx.token.assetDataA.tokenAddress)
      this._scan.openTokenUrl(this._zeroEx.token.assetDataB.tokenAddress)
    }
  }
}