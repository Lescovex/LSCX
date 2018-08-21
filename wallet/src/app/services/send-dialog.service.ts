import { Injectable } from '@angular/core';

/*Dialog*/
import { MdDialog } from '@angular/material';
import { SendDialogComponent } from '../components/dialogs/send-dialog.component';


@Injectable()
export class SendDialogService{
    constructor(public dialog: MdDialog){}

    openConfirmSend(tx, to, amount, fees, total, action, token?){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
              tx: tx,
              to: to,
                amount: amount,
                fees: fees,
                total: total,
                action: action,
                token : token
            },
        });
    }
    openConfirmDeploy(tx, amount, fees, total, action, contract){
        return this.dialog.open(SendDialogComponent, {
          width: '660px',
          height: '400px',
          data:{
            tx: tx,
            amount: amount,
            fees: fees,
            total: total,
            action: action,
            contract : contract},
        });
    }
}