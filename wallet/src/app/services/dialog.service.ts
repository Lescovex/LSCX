import { Injectable } from '@angular/core';

/*Dialog*/
import { MdDialog } from '@angular/material';
import { PendingDialogComponent } from '../components/dialogs/pending-dialog.component';
import { ErrorDialogComponent } from '../components/dialogs/error-dialog.component';
import { WaitingDialogComponent } from '../components/dialogs/waiting-dialog.component';

@Injectable()
export class DialogService{
    constructor(public dialog: MdDialog){}

    openErrorDialog(title, message, error, action?){
        return this.dialog.open(ErrorDialogComponent, {
            width: '660px',
            height: '195px',
            data: {
              title: title,
              message: message,
              error: error,
              action:action
            }
          });
    }
    openPendignDialog(hash){
        return this.dialog.open(PendingDialogComponent, {
            width: '660px',
            height: '195px',
            data:hash,
            disableClose: true,
          });

    }
    openWaitingTxDialog(text){
        return this.dialog.open(WaitingDialogComponent, {
            width: '660px',
            height: '150px',
            data: text,
            disableClose: true,
          });
    }
}