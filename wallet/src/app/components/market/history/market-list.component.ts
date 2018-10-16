import { Component, OnInit, OnChanges, Input , OnDestroy} from '@angular/core';
import { Web3 } from '../../../services/web3.service';
import { MarketService } from '../../../services/market.service';
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
    @Input() address: "string";
    @Input() action: "string";

    blockNumber;
    loading:boolean = false;
    totalPages:number = 0;
    page:number = 1;
    limit:number = 15;
    interval;

    items: any[];

    constructor(private _web3: Web3, protected _market: MarketService, private _dialog: DialogService, private _sendDialogService: SendDialogService, private _account: AccountService ) {
    }

    ngOnInit(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();
        this.interval = setInterval(async()=>{
            let blockNum = await this._web3.blockNumber();
            
            this.blockNumber = (typeof(blockNum)== "number")? blockNum : null
        });
    }
    
    ngOnChanges(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        if(this.page==1){
            this.getItmes();
        }
  
    }

    ngOnDestroy(): void {
        clearImmediate(this.interval);
    }

    openExternal(txHash){
        const shell = require('electron').shell;
        let net = (this._web3.network==1) ? "":"ropsten.";
        shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
    }

    async cancelOrder(order) {
        
        let dialogRef = this._dialog.openLoadingDialog();
        let data = await this._market.getFunctionData(this._market.contractEtherDelta,'cancelOrder', [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.v, order.r, order.s])
        let gasPrice = await this._web3.getGasPrice();
        let tx =  new RawTx(this._account, this._market.contractEtherDelta.address, new BigNumber(0), this._market.config.gasOrder, gasPrice, this._web3.network, data);
        dialogRef.close();
        this._sendDialogService.openConfirmSend(tx.tx, this._market.contractEtherDelta.address, tx.amount,tx.gas, tx.cost, "send");
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