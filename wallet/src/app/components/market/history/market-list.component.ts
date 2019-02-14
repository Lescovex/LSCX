import { Component, OnInit, OnChanges, Input , OnDestroy} from '@angular/core';
import { MdDialog } from '@angular/material';
import { Web3 } from '../../../services/web3.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { DialogService } from '../../../services/dialog.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { RawTx } from '../../../models/rawtx';
import BigNumber from 'bignumber.js';
import { AccountService } from '../../../services/account.service';
import { OrderDialogComponent } from "./order-dialog.component";

import { ZeroExService } from "../../../services/0x.service";
import { EtherscanService } from "../../../services/etherscan.service";
@Component({
  selector: 'app-market-list',
  templateUrl: './market-list.component.html',
})
export class MarketListComponent implements OnInit, OnChanges, OnDestroy {
    @Input() history: any[];
    @Input() address: string;
    @Input() action: string;

    blockNumber;
    loading:boolean = false;
    totalPages:number = 0;
    page:number = 1;
    limit:number = 15;
    interval= null;
    intervalOrders;
    items: any[];
    orderDialog;
    loadingD= null;
    
    constructor(public _zeroEx:ZeroExService, private _web3: Web3, public _LSCXmarket: LSCXMarketService, private _dialog: DialogService, private _sendDialogService: SendDialogService, private _account: AccountService, public dialog: MdDialog, public _scan: EtherscanService ) {
        Promise.resolve().then(() => { this.loadingD = this._dialog.openLoadingDialog();});
    }

    async ngOnInit() {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();

        let blockNum = await this._web3.blockNumber();
        this.blockNumber = (typeof(blockNum)== "number")? blockNum : null;
        this._LSCXmarket.checkMyOrdersDeleted(this.blockNumber, this._web3.network.chain)
        this._LSCXmarket.checkShowSellsDeleted(this.blockNumber, this._web3.network.chain);
        this._LSCXmarket.checkShowBuysDeleted(this.blockNumber, this._web3.network.chain); 
        
        if(this.action == "myOrders"){
            if(this.loadingD != null){
                this.loadingD.close();
            }
           
            this._LSCXmarket.startActiveOrdersInterval();
            
            
        }
    }

    ngOnChanges(): void {
        if(this.action == "myOrders"){
            this._LSCXmarket.startActiveOrdersInterval();
        }
        if(this.action != "myOrders" && this.interval != null){
            //clearInterval(this.interval);
            //this.interval= null;
        }
        this.totalPages = Math.ceil(this.history.length/this.limit);
        if(this.page==1){
            this.getItmes();
        }
        
    }
    
    orderByPrice(object){
          object.sort(function (a, b) {
            if ( a.price > b.price )
              return -1;
            if ( a.price < b.price )
              return 1;
              return 0;
          })
        
        return object;
      }

    async openOrderDialog(action, order){
        if(this._zeroEx.display == 'eth'){
            order.tokenName = this._LSCXmarket.token.name;
            order.action = action;
            order.display = this._zeroEx.display;
            if(order.action == "sell"){
                order.totalAmount = order.amountBase;
            }else{
                order.totalAmount = order.amount;
            }
            let orderDialog = this.dialog.open( OrderDialogComponent, {
                width: '660px',
                height: '450px',
                panelClass: 'dialog',
                data: order
            });
        }
        if(this._zeroEx.display == 'weth'){
            order.action = action;
            order.taker = this._account.account.address;
            order.display = this._zeroEx.display;

            order.tokenName = this._zeroEx.token.assetDataB.name;
            order.tokenAddr = this._zeroEx.token.assetDataB.tokenAddress;
            order.displayToken = order.takerData.symbol;
            order.priceSymbol = order.makerData.symbol;

            let orderDialog = this.dialog.open( OrderDialogComponent, {
                width: '660px',
                height: '520px',
                panelClass: 'dialog',
                data: order
            });
            
        }

    }
    ngOnDestroy(): void {
        if(this.interval != null){
            this._LSCXmarket.clearActiveOrdersInterval();
            this.interval = null;
        }
    }

    openExternal(txHash){
        const shell = require('electron').shell;
        let net;
        switch(this._web3.network.chain){
            case 1: 
                net = "";
                break;
            case 3:
                net = "ropsten.";
                break;
            case 42:
                net = "kovan.";
                break;
        }
        shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
    }

    async cancelOrder(order) {
        
        let dialogRef = this._dialog.openLoadingDialog();
        let data = await this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'cancelOrder', [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.v, order.r, order.s])
        let gasPrice = await this._web3.getGasPrice();
        let tx =  new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), this._LSCXmarket.config.gasOrder, gasPrice, this._web3.network, data);
        dialogRef.close();
        this._sendDialogService.openConfirmSend(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount,tx.gas, tx.cost, "send");
    }

    getItmes(): void {
        let from = this.limit*(this.page-1);
        let to = from + this.limit;
        this.items = this.history.slice(from, to);
        
    }

    goToPage(n: number): void {
        this.page = n;
        this.getItmes();
    }

    openExternalToken(){
        if(this._zeroEx.display == 'eth'){
          this._scan.openTokenUrl(this._LSCXmarket.token.addr)
        }
        if(this._zeroEx.display == 'weth'){
          this._scan.openTokenUrl(this._zeroEx.token.assetDataA.tokenAddress)
          this._scan.openTokenUrl(this._zeroEx.token.assetDataB.tokenAddress)
        }
      }
}