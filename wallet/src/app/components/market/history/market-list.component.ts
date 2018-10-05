import { Component, OnInit, OnChanges, Input , OnDestroy} from '@angular/core';
import { Web3 } from '../../../services/web3.service';
import { MarketService } from '../../../services/market.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { DialogService } from '../../../services/dialog.service';
import { SendDialogService } from '../../../services/send-dialog.service';

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

    constructor(private _web3: Web3, protected _market: MarketService, private _rawtx: RawTxService, private _dialog: DialogService, private _sendDialogService: SendDialogService) {
    }

    ngOnInit(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();
        this.interval = setInterval(async()=>{
            let blockNum = await this._web3.blockNumber();
            console.log(typeof(blockNum))
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
        console.log(order)
        let dialogRef = this._dialog.openLoadingDialog();
        let data = await this._market.getFunctionData(this._market.contractEtherDelta,'cancelOrder', [order.tokenGet,order.amountGet.toNumber(), order.tokenGive, order.amountGive.toNumber(), order.expires, order.nonce, order.v, order.r, order.s])
        let tx = await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0, {data:data, gasLimit: this._market.config.gasOrder });
        dialogRef.close();
        this._sendDialogService.openConfirmSend(tx[0], this._market.contractEtherDelta.address, tx[2],tx[1]-tx[2], tx[1], "send");
    }

    getItmes(): void {
        let from = this.limit*(this.page-1);
        let to = from + this.limit;
        this.items = this.history.slice(from, to);
        //console.log("from",from, "to",to,"   ",this.items)
    }

    goToPage(n: number): void {
        this.page = n;
        this.getItmes();
    }
}