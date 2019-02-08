import { Component, OnInit, OnChanges, Input } from '@angular/core';


@Component({
  selector: 'btcapp-list',
  templateUrl: './btclist.component.html',
  styleUrls: ['./list.page.css']
})
export class BitcoinListComponent implements OnInit, OnChanges {
    @Input() history: any[];
    @Input() address: "string";

    loading = false;
    totalPages = 0;
    page = 1;
    limit = 10;

    items: any[];

    constructor() {
    }

    ngOnInit(): void {
        
        this.totalPages = Math.ceil(this.history.length/this.limit);
        this.getItmes();
        
        
    }
    ngOnChanges(): void {        
        this.totalPages = Math.ceil(this.history.length/this.limit);
        if(this.page==1){
            this.getItmes();
        }
    }
    openExternal(txHash){
        const shell = require('electron').shell;
        shell.openExternal('https://www.blockchain.com/btc/tx/'+txHash);
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