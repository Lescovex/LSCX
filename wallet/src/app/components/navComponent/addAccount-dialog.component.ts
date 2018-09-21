import { Component, OnInit, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';
import {NewAccountDialogComponent} from './newAccount-dialog.component';
import {ImportAccountDialogComponent} from './importAccount-dialog.component';

@Component({
  selector: 'addAccount-dialog',
  templateUrl: './addAccount-dialog.component.html'
})
export class AddAccountDialogComponent implements OnInit {
  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<AddAccountDialogComponent>) { }

  ngOnInit() {
  }

  openAccountDialog(type){
    let dialog : any;
    switch(type){
      case 'import':
        dialog = ImportAccountDialogComponent
      break;
      case 'new':
        dialog = NewAccountDialogComponent;
        break;
    }
    this.dialogRef.close();
    let dialogRef = this.dialog.open(dialog, {
      width: '660px',
      height: (type=='import')?'600px':'350px',
    });

  }
  closeDialog(){
    this.dialogRef.close();
  }

}
