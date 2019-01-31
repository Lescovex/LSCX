import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import { Web3 } from '../../services/web3.service';
import { ResendTxDialogComponent } from './resendTx-dialog.component';
import { EtherscanService } from '../../services/etherscan.service';


@Component({
    selector: 'show-tx',
    templateUrl: './showTx-dialog.component.html'
})

export class ShowTxDialogComponent implements OnInit{
    submited = false;
    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<ShowTxDialogComponent>, protected _scan : EtherscanService, private _web3: Web3, private dialog: MdDialog){
    }

    ngOnInit(){
    }

    closeDialog(){
        this.dialogRef.close();
    }

    resend(){
        this.dialogRef.close();
        this.dialog.open(ResendTxDialogComponent, {
            width: '660px',
            height: '',
            data: this.data
          });
    }

    openExternal(txHash){
        const shell = require('electron').shell;
      
        let net = this._scan.urlStarts.replace("-", "");
		if(net!=""){
			net = net+".";
        }
        
        shell.openExternal('https://'+net+'etherscan.io/tx/'+txHash);
    }

}