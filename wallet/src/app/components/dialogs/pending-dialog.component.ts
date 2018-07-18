import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'pending-dialog',
    template: '<div class="text-center"> <h1 class="dist">Pending...</h1> <p *ngIf="data != null" class="black">TxHash: <span>{{data}}</span></p> </div>'
})

export class PendingDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: any){
        
    }

}