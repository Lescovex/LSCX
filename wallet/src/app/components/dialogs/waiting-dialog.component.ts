import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import {MD_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'waiting-dialog',
    templateUrl: './waiting-dialog.component.html'
})

export class WaitingDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: string, public dialogRef: MdDialogRef<WaitingDialogComponent>){

    }
}