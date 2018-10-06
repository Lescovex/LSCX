import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';


@Component({
    selector: 'error-dialog',
    templateUrl: './error-dialog.component.html'
})

export class ErrorDialogComponent implements OnInit{
    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<ErrorDialogComponent>){

    }
    ngOnInit(){

    }
    closeDialog(){
        let self= this;
        if(typeof(this.data.action != 'undefined')){
            this.dialogRef.close(this.data.action);
        }
        this.dialogRef.close();
    }

}