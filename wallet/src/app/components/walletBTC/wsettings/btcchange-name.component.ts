import { Component, Inject  } from '@angular/core'

import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

@Component({
  selector: 'btcchange-name',
  templateUrl: './btcchange-name.component.html'
})
export class BitcoinChangeNameComponent{
  constructor(public dialog: MdDialog,public dialogRef: MdDialogRef<BitcoinChangeNameComponent>) {
   
  }
  
  closeDialog(){
    this.dialogRef.close();
  }
  change(){
    this.dialogRef.close("change");
  }
}