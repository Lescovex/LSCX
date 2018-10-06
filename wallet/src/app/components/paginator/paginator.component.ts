import { Component, EventEmitter } from '@angular/core'
import {Input, Output} from '@angular/core';
declare var require: any;



@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})

export class PaginatorComponent{

  
    @Input() currentPage: number;
    @Input() count: number;
    @Input() perPage: number;
    @Input() loading: boolean;
    @Input() pagesToShow: number;

    @Output() goPage = new EventEmitter<number>();
    
    constructor() { }

    onPage(n: number): void {
        this.goPage.emit(n);
        
    }

}
