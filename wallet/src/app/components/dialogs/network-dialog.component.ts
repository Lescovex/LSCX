import { Component,  Inject } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'network-dialog',
    templateUrl: './network-dialog.component.html'
})

export class NetworkDialogComponent{

    constructor(@Inject(MD_DIALOG_DATA) public data: string,public dialogRef: MdDialogRef<NetworkDialogComponent>){
    }
    closeDialog(){
        this.dialogRef.close();
    }
}