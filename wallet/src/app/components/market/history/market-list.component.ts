import { Component, OnInit, OnChanges, Input , OnDestroy} from '@angular/core';
import { Web3 } from '../../../services/web3.service';
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { DialogService } from '../../../services/dialog.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { RawTx } from '../../../models/rawtx';
import BigNumber from 'bignumber.js';
import { AccountService } from '../../../services/account.service';

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

    items: any[];

    constructor(private _web3: Web3, protected _LSCXmarket: LSCXMarketService, private _dialog: DialogService, private _sendDialogService: SendDialogService, private _account: AccountService ) {
    }

    ngOnInit(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();
        console.log("history", this.history);
    }
    
    ngOnChanges(): void {
        if(this.action == "myOrders"){
            this.interval = setInterval(async()=>{
                let blockNum = await this._web3.blockNumber();
                this.blockNumber = (typeof(blockNum)== "number")? blockNum : null
                this._LSCXmarket.checkMyOrdersDeleted(this.blockNumber, this._web3.network.chain);                
            },250); 
        }
        if(this.action != "myOrders" && this.interval != null){
            clearInterval(this.interval);
            this.interval= null;
        }
        this.totalPages = Math.ceil(this.history.length/this.limit);
        if(this.page==1){
            this.getItmes();
        }
  
    }

    ngOnDestroy(): void {
        if(this.interval != null){
            clearInterval(this.interval);
            this.interval= null;
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
}