import { Component,  Inject } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'msg-dialog',
    templateUrl: './message-dialog.component.html'
})

export class MessageDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: string,public dialogRef: MdDialogRef<MessageDialogComponent>){
    }
    
    closeDialog(){
        this.dialogRef.close();
    }
}