import { Component,  Inject, } from '@angular/core';
import { MdDialogRef, MdDialog, MD_DIALOG_DATA} from '@angular/material';
import { Web3 } from '../../services/web3.service';

import { SendMarketDialogComponent } from './send-market-dialog.component';
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
    constructor(@Inject(MD_DIALOG_DATA) public data: any, protected dialog: MdDialog, protected _account: AccountService, protected _LSCXmarket: LSCXMarketService,  public dialogRef: MdDialogRef<TikerDialogComponent>, protected _web3: Web3){
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
        let tikerString = JSON.stringify({addr:this.data.contract.address, name:this.data.contract.symbol, decimals:this.data.contract.decimals});
        tikerString = tikerString.replace(/"/g,"'");
        params.push(tikerString);
        
        
        let data = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket,'tiker', params);
        
        let gasLimit;
        
        try{
          gasLimit = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data, this._LSCXmarket.fees.feeMarket);
        }catch(e){    
          gasLimit = 300000;
        }
        
        
        let gasOption = await this.openGasDialog(gasLimit);
        if(gasOption != null){
            let nonce = await this.getNonce();
            let tikerObj = {
                addr: this.data.contract.address,
                account: this._account.account.address,
                nonce: nonce
            }
            
            let tx = new RawTx(this._account,this._LSCXmarket.contractMarket.address,new BigNumber(this._LSCXmarket.fees.feeMarket.toString()),gasOption.gasLimit, gasOption.gasPrice, this._web3.network, data);
            this.openSendDialog(tx, tikerObj);
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

    openSendDialog(tx, tikerObj){        
        this.dialog.open(SendMarketDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx.tx,
                to: this._LSCXmarket.contractMarket.address,
                amount: tx.amount,
                fees: tx.gas,
                total: tx.cost,
                action: 'send',
                typeFunction: 'listTiker',
                functionObj : tikerObj
            },
        });
    }

    async getNonce(){
        let nonce = await this._web3.getNonce(this._account.account.address);
        
        let history = this._account.account.history.filter(x=> x.from.toLowerCase() ==this._account.account.address);
        let historyNonce = history[0].nonce;
        if(historyNonce>= nonce){
            nonce = parseInt(historyNonce)+1;
        }
        return nonce;
      }

}