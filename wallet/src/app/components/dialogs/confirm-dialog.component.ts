import { Component, Inject  } from '@angular/core'

import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent{
  pass;
  constructor(@Inject(MD_DIALOG_DATA) public data: string, private dialogRef: MdDialogRef<ConfirmDialogComponent>) {
  }

  closeDialog() {
    this.dialogRef.close();
  }

  confirm(pass){
    this.dialogRef.close(pass);
  }
}