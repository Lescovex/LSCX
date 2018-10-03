import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import { Web3 } from '../../services/web3.service';


@Component({
    selector: 'gas-dialog',
    templateUrl: './gas-dialog.component.html'
})

export class GasDialogComponent implements OnInit{
    submited = false;
    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<GasDialogComponent>, private _web3: Web3){
        this.data.gasPrice =(this._web3.web3.fromWei(_web3.web3.eth.gasPrice, 'Gwei')).toFixed(1);
    }
    ngOnInit(){

    }
    closeDialog(){
        console.log('close')
        this.dialogRef.close();
    }

    confirm(form){
        console.log('confirm', form)
        this.submited = true;
        if(form.invalid){
            return false;
        }
        this.dialogRef.close(JSON.stringify({gasLimit: this.data.gasLimit, gasPrice: parseInt(this._web3.web3.toWei(this.data.gasPrice, 'gwei'))}));
    }

}