import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';

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
    noOpenDialog = false;

    constructor(private _web3: Web3, private _dialog: DialogService) {
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

    async openExternal(tx){
        if(this.noOpenDialog){
            return false;
        }
        this.noOpenDialog = true;
        
        if(!('blockNumber' in tx)){
            let tx2 = await this._web3.getTx(tx.hash);
            if(tx2 != null){
                tx=tx2;
            }
        }
        
        let dialogRef = this._dialog.openShowTx(tx);
        dialogRef.afterClosed().subscribe(()=>{this.noOpenDialog=false});
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