import { Component,  Inject } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';
import { WithdrawTxDialog } from './withdrawTx.component';

@Component({
    selector: 'withdraw-deal',
    templateUrl: './withdraw-dialog.component.html'
})

export class WithdrawDialog{

    constructor(@Inject(MD_DIALOG_DATA) public data: string, public dialogRef: MdDialogRef<WithdrawTxDialog>){
    }
}