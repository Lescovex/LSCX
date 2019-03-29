import { Component, OnInit, Inject  } from '@angular/core'

import { MdButtonModule } from '@angular/material';

import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';
//import { BitcoinNewAccountDialogComponent } from './BitcoinNewAccount-dialog.component';
//import { BitcoinImportAccountDialogComponent } from './BitcoinImportAccount-dialog.component';

@Component({
  selector: 'BitcoinAddAccount-dialog',
  templateUrl: './BitcoinAddAccount-dialog.component.html'
})
export class BitcoinAddAccountDialogComponent implements OnInit {
  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<BitcoinAddAccountDialogComponent>) { }

  ngOnInit() {
  }

  openAccountDialog(type){
    let dialog : any;
    switch(type){
      case 'import':
        //dialog = BitcoinImportAccountDialogComponent
      break;
      case 'new':
        //dialog = BitcoinNewAccountDialogComponent;
        break;
    }
    this.dialogRef.close();
    let dialogRef = this.dialog.open(dialog, {
      width: '660px',
      height: (type=='import')?'450px':'350px',
    });

  }
  closeDialog(){
    this.dialogRef.close();
  }

}
