import { Component,  Inject, } from '@angular/core';
import { MdDialogRef, MdDialog, MD_DIALOG_DATA} from '@angular/material';
import { Web3 } from '../../services/web3.service';

import { SendDialogComponent } from './send-dialog.component';
import { GasDialogComponent } from './gas-dialog.component';
import { RawTx } from '../../models/rawtx';
import { LSCXMarketService } from '../../services/LSCX-market.service';
import { AccountService } from '../../services/account.service';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'tiker-dialog',
    templateUrl: './tiker-dialog.component.html'
})

export class TikerDialogComponent {
    submited = false;
    constructor(@Inject(MD_DIALOG_DATA) public data: any, private dialog: MdDialog, private _account: AccountService, private _LSCXmarket: LSCXMarketService,  public dialogRef: MdDialogRef<TikerDialogComponent>, private _web3: Web3){
    }
    closeDialog(){
        this.dialogRef.close();
    }

    async confirm(form){
        this.submited = true;
        if(form.invalid){
            return false;
        }
        this.dialogRef.close();
        let params = [this.data.contract.address, this.data.contract.symbol, this.data.contract.decimals];
        console.log("PARAMS",params)
        let data = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'tiker', params);
        console.log("gas");
        let gasOption = await this.openGasDialog(300000);
        if(gasOption != null){
            let tx = new RawTx(this._account,this._LSCXmarket.contractMarket.address,new BigNumber(this._LSCXmarket.fees.feeMarket.toString()),gasOption.gasLimit, gasOption.gasPrice, this._web3.network, data);
            this.openSendDialog(tx);
        }else{
            return false;
        }
        
    }

    async openGasDialog(gasLimit){
        let dialogRef = this.dialog.open(GasDialogComponent, {
            width: '660px',
            height: '280px',
            data: {
                gasLimit: gasLimit,
                gasPrice: 1
            }
          });
        let result = await dialogRef.afterClosed().toPromise();
        
        if(typeof(result) != 'undefined'){
            let obj = JSON.parse(result);
            return obj;
        }
        return null;
    }

    openSendDialog(tx){
        this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx.tx,
                to: this._LSCXmarket.contractMarket.address,
                amount: tx.amount,
                fees: tx.gas,
                total: tx.cost,
                action: 'send',
            },
        });

    }

}