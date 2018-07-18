import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import {MD_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'loading-dialog',
    templateUrl: './loading-dialog.component.html'
})

export class LoadingDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: string, public dialogRef: MdDialogRef<LoadingDialogComponent>){

    }
}