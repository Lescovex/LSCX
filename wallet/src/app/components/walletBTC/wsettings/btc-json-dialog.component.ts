import { Component, Inject  } from '@angular/core'

import {MdDialogRef} from '@angular/material';
import {MD_DIALOG_DATA} from '@angular/material';

import { DialogService } from '../../../services/dialog.service'

@Component({
  selector: 'btc-json-dialog',
  templateUrl: './btc-json-dialog.component.html'
})
export class BitcoinJSONDialogComponent{
  constructor(@Inject(MD_DIALOG_DATA) public data: any ,public dialogRef: MdDialogRef<BitcoinJSONDialogComponent>,private dialogService: DialogService) {
   }

  downloadFile(){
    this.dialogRef.close();
    
    let fs = require('fs');
    let app = require('electron').remote; 
    let dialog = app.dialog;
    let error:string = "";
    let paths:string[];
    let self = this;
    
    paths = dialog.showOpenDialog({properties: ['openDirectory']});
    

    if(typeof(paths) != 'undefined'){
      let json = JSON.stringify(this.data.v3);   
      fs.writeFile(paths[0]+"/"+this.data.fileName+".json" , json, (err) => {
        if(err){
          error= err.message;
        }
      });
      setTimeout(function(){
        let title = (error=="")? 'The file has been succesfully saved' : 'Unable to export wallet';
        let message = (error=="")? '' : 'Something was wrong';
        let dialogRef = self.dialogService.openErrorDialog(title, message, error)
      }, 400)
    }
     
    
  }
  
  closeDialog(){
    this.dialogRef.close();
  }

}