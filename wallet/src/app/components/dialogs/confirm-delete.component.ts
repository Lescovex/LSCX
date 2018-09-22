import { Component, Inject  } from '@angular/core'

import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import {} from '@angular/material';

@Component({
  selector: 'confirm-delete',
  templateUrl: './confirm-delete.component.html'
})
export class DeleteDialog{
  constructor(@Inject(MD_DIALOG_DATA) public data: string, private dialogRef: MdDialogRef<DeleteDialog>) {
  }

  closeDialog() {
    this.dialogRef.close();
  }

  delete(remove:boolean){
    this.dialogRef.close(remove);
  }
}