import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
    selector: 'msg-dialog',
    templateUrl: './message-dialog.component.html'
})

export class MessageDialogComponent{

    constructor(public dialogRef: MdDialogRef<MessageDialogComponent>){

    }
    closeDialog(){
        this.dialogRef.close();
    }
}