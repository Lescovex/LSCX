import { Component, Inject } from '@angular/core'

import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';


@Component({
  selector: 'zeroExConfirm-dialog',
  templateUrl: './zeroExConfirm-dialog.component.html'
})

export class ZeroExConfirmDialogComponent{
  pass;
  constructor(@Inject(MD_DIALOG_DATA) public data: string, private dialogRef: MdDialogRef<ZeroExConfirmDialogComponent>) {
    
  }

  closeDialog() {
    this.dialogRef.close();
  }

  confirm(pass){
    this.dialogRef.close(pass);
  }
}