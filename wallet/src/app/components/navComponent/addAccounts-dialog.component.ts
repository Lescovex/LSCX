import { Component, OnInit, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';
import {AddAccountDialogComponent} from './addAccount-dialog.component';

@Component({
  selector: 'addAccounts-dialog',
  templateUrl: './addAccounts-dialog.component.html'
})
export class AddAccountsDialogComponent implements OnInit {
  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<AddAccountsDialogComponent>) { }

  ngOnInit() {
  }

  openAccountDialog(type){
    let dialog : any;
    switch(type){
      case 'ethereum':
        dialog = AddAccountDialogComponent
      break;
    }
    this.dialogRef.close();
    let dialogRef = this.dialog.open(dialog, {
      width: '660px',
      height: '155px',
    });

  }
  closeDialog(){
    this.dialogRef.close();
  }

}
