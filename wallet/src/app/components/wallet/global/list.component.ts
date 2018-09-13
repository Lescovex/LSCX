import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { Web3 } from '../../../services/web3.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
})
export class ListComponent implements OnInit, OnChanges {
    @Input() history: any[];
    @Input() address: "string";

    loading = false;
    totalPages = 0;
    page = 1;
    limit = 10;

    items: any[];

    constructor(private _web3: Web3) {
    }

    ngOnInit(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();
        console.log(this.items.length)
    }
    
    ngOnChanges(): void {
        this.totalPages = Math.ceil(this.history.length/this.limit);
        if(this.page==1){
            this.getItmes();
        }
  
    }
    openExternal(txHash){
        const shell = require('electron').shell;
        let net = (this._web3.network==1) ? "":"ropsten.";
        shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
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