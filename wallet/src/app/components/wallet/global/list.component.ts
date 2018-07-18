import { Component, OnInit, OnChanges, Input } from '@angular/core';

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

    constructor() {
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