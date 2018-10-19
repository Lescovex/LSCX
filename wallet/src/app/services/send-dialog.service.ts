import { Injectable } from '@angular/core';

/*Dialog*/
import { MdDialog } from '@angular/material';
import { SendDialogComponent } from '../components/dialogs/send-dialog.component';
import { SendOrderDialogComponent } from '../components/dialogs/send-order-dialog.component';
import { SendMarketDialogComponent } from '../components/dialogs/send-market-dialog.component';


@Injectable()
export class SendDialogService{
    constructor(public dialog: MdDialog){}

    openConfirmSend(tx, to, amount, fees, total, action, token?, tokenAmount? ){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                fees: fees,
                total: total,
                action: action,
                token : token,
                tokenAmount : tokenAmount
            },
        });
    }

    openConfirmDeploy(tx, amount, fees, total, action, contract){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                amount: amount,
                fees: fees,
                total: total,
                action: action,
                contract : contract},
        });
    }

    openConfirmOrder(to, fees, action, hashParams, gasOptions){
        return this.dialog.open(SendOrderDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                to: to,
                amount: 0,
                fees: fees,
                total: fees,
                action: action,
                params: hashParams,
                gasOpt: gasOptions
            },
        });
    }

    openConfirmMarket(tx, to, amount, fees, total, action, typeFunction, functionObj ){
        return this.dialog.open(SendMarketDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                fees: fees,
                total: total,
                action: action,
                typeFunction: typeFunction,
                functionObj : functionObj
            },
        });
    }

    openConfirmAlternativeSend(tx, to, amount, fees, total, action, seedOptions ){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                fees: fees,
                total: total,
                action: action,
                seedOptions: seedOptions
            },
        });
    }
}