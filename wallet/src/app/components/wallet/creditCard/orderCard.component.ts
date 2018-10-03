import { Component, OnInit } from '@angular/core';
import { Http, HttpModule, Headers } from '@angular/http';

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';
import { AccountService } from '../../../services/account.service';
import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';

import { Router, NavigationEnd } from '@angular/router';
import { ERROR_LOGGER } from '../../../../../node_modules/@angular/core/src/errors';
const shell = require('electron').shell;

@Component({
  selector: 'orderCard',
  templateUrl: './orderCard.component.html',
})


export class OrderCardComponent implements OnInit {
    protected input_26; //Card type
    protected input_8_47; //Quantity
    protected input_8_40; //Personalized name

    //shippig details 
    protected input_8_1; //Name
    protected input_8_2; //Last Name
    protected input_8_3; //DNI/NIE/Passport
    protected input_8_6; //Where did you learn about Spark?

    protected input_41; //shipping spark25€
    protected input_36; //shipping spark10€

    protected cardTypeDisplay;
    protected shippingDisplay;


    constructor(private dialog: MdDialog, private http: Http, public _web3: Web3,private _account: AccountService, private sendDialogService: SendDialogService,  private _rawtx: RawTxService, private router : Router) {
        
    }
    ngOnInit(){
        
    }
    
    selectType(type){
        console.log(type);
        this.cardTypeDisplay = type;
        if(this.shippingDisplay != null){
            this.shippingDisplay = null;
        }
    }

    confirm(form){
        console.log(form);
        
    }

    shippingType(type){
        console.log(type);
        this.shippingDisplay = type;
    }
    openExternal(txHash){
        const shell = require('electron').shell;
        let net = (this._web3.network==1) ? "":"ropsten.";
        shell.openExternal('https://www.tip-sa.com/envios-de-paquetes/urgente-14-horas');
    }
}
