import { Component,  Inject } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'card-msg-dialog',
    templateUrl: './card-message-dialog.component.html'
})

export class CardMessageDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: string,public dialogRef: MdDialogRef<CardMessageDialogComponent>){
    }
    closeDialog(){
        this.dialogRef.close();
    }
}