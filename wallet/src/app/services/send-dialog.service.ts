import { Injectable } from '@angular/core';

/*Dialog*/
import { MdDialog } from '@angular/material';
import { SendDialogComponent } from '../components/dialogs/send-dialog.component';
import { SendOrderDialogComponent } from '../components/dialogs/send-order-dialog.component';
import { SendMarketDialogComponent } from '../components/dialogs/send-market-dialog.component';
//import { BitcoinSendDialogComponent } from "../components/dialogs/send-dialog-bitcoin.component";

@Injectable()
export class SendDialogService{
    constructor(public dialog: MdDialog){}

    openConfirmSend(tx, to, amount, gas, total, action, token?, tokenAmount? ){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                gas: gas,
                total: total,
                action: action,
                token : token,
                tokenAmount : tokenAmount
            },
        });
    }

    openConfirmDeploy(tx, amount, gas, total, action, contract){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                amount: amount,
                gas: gas,
                total: total,
                action: action,
                contract : contract
            },
        });
    }

    openConfirmOrder(to, gas, action, hashParams, gasOptions){
        return this.dialog.open(SendOrderDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                to: to,
                amount: 0,
                gas: gas,
                total: gas,
                action: action,
                params: hashParams,
                gasOpt: gasOptions
            },
        });
    }

    openConfirmMarketOrders(tx, to, amount, gas, total, action, typeFunction, functionObj, fees, tokenName){
        return this.dialog.open(SendMarketDialogComponent, {
            width: '660px',
            height: '450px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                gas: gas,
                total: total,
                action: action,
                typeFunction: typeFunction,
                functionObj : functionObj,
                fees: fees,
                tokenName
            },
        });
    }

    openConfirmMarketFunds(tx, to, amount, gas, total, action, typeFunction, functionObj ){
        return this.dialog.open(SendMarketDialogComponent, {
            width: '660px',
            height: '450px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                gas: gas,
                total: total,
                action: action,
                typeFunction: typeFunction,
                functionObj : functionObj
            },
        });
    }

    openConfirmAlternativeSend(tx, to, amount, gas, total, action, seedOptions ){
        return this.dialog.open(SendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
                tx: tx,
                to: to,
                amount: amount,
                gas: gas,
                total: total,
                action: action,
                seedOptions: seedOptions
            },
        });
    }
/*
    openConfirmSendBitcoin(sender, receiver, amount){
        return this.dialog.open(BitcoinSendDialogComponent, {
            width: '660px',
            height: '400px',
            data:{
              sender: sender,
              receiver: receiver,
              amount: amount
            },
          });
      }
      */
}