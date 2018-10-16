import { Component, OnInit } from '@angular/core';
import { Http, HttpModule, Headers, RequestOptions } from '@angular/http';

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';
import { AccountService } from '../../../services/account.service';
import { Web3 } from '../../../services/web3.service';
import { SendDialogService } from '../../../services/send-dialog.service';
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
    protected input_47 = 'Select a quantity'; //Quantity
    protected input_40; //Personalized name

    //shippig details 
    protected input_1; //Name
    protected input_2; //Last Name
    protected input_3; //DNI/NIE/Passport
    protected input_6 = 'Choose an option'; //Where did you learn about Spark?
    protected input_4; //Street
    protected input_5; //Number
    protected input_7; //Floor
    protected input_9; //Door
    protected input_10; //Postal Code
    protected input_11; //City
    protected input_12; //Province
    protected input_38 = 'Select a country'; //Country
    protected input_22; //Telephone
    protected input_13; //E-mail

    protected input_41; //shipping spark25€
    protected input_36; //shipping spark10€

    protected input_8 = 'Choose an option'; //Payment Method
    protected choice_8_14_1; //checkbox
    protected input_8_27; //total;
    protected is_submit_8 = 1;
    protected gform_submit = 8;

    protected gform_target_page_number_8 = 0;
    protected gform_source_page_number_8 = 1;

    protected total=0;

    protected cardTypeDisplay;
    protected shippingDisplay;
    protected cardTypeValue =0;
    protected shippingValue =0;


    protected state_8 ="WyJ7XCIyNlwiOltcIjljOWFlMWQ0OTNkNzQ3ODJmN2M2Yjk1NGM4MDQ3ZGMwXCIsXCIwYmY0NTFhYWRjMTMyM2I5M2FlYmMzZmE4MDQ4ZWViY1wiXSxcIjQ3XCI6W1wiZTEwNzJkNTEyNWEzMmI5Zjk0NzRjMzFjMmNkMDYzODNcIixcImU0MjNiMzEzNjk1Yjc5N2I2MDJkM2IyZjUzNjk4NzcwXCIsXCI2Y2JmOWNmNTNiODg2MmU5M2RjZDI2MjM3OThjZjE3NFwiXSxcIjM2XCI6W1wiY2VkODc2MTEzYWY2NzNlYmNmZTVkNmIyMmU3ZTZlNjRcIixcImU3MzA2NjI5MTdkMzcxOTliNDNiMGUzODFhYjI2YTg4XCJdLFwiMzdcIjpbXCJhYzk5NjNiMWIyMTI1MWZlNWY2ZGFjNzgyMGRiZDBhMVwiLFwiOTJhNGYzNzU3MzkzZTEyMGYxMzY1OTM5NGQyZDdiZjJcIl0sXCI0MVwiOltcIjYzYjY5YjFmMzhlMmQzMzliOThmYWI5MjQ1MGZiMWU2XCJdfSIsIjNiYmQxNWRkMGI5OWM5ZDYyNjcxYjNmNjkyMTIzYTU4Il0="

    constructor(private dialog: MdDialog, private http: Http, public _web3: Web3,private _account: AccountService, private sendDialogService: SendDialogService,  private router : Router) {
        
    }
    ngOnInit(){
        
    }
    
    selectType(type){
        
        this.cardTypeDisplay = type;
        if(this.shippingDisplay != null){
            this.shippingDisplay = null;
        }
        if(type == 'Spark MasterCard without name - 10€|10'){
            this.cardTypeValue = 10;
            this.shippingValue = 0;
            if(this.input_36 == 'Tourline express|5'){
                this.shippingValue = 5;
            }
            this.total = this.cardTypeValue + this.shippingValue;
        }
        if(type == 'Spark MasterCard embossed with your name - 25€|25'){
            this.cardTypeValue = 25;
            this.total = this.cardTypeValue;
        }
    }

    confirm(form){
        
        let f = form.controls;
        let error ="";

        let obj;

        if(f.input_26.value == 'Spark MasterCard without name - 10€|10'){
            obj = {
                input_26: f.input_26.value, //type
                input_47: f.input_47.value, //quantity or personalized name
                input_1: f.input_1.value, //name
                input_2: f.input_2.value, //last name
                input_3: f.input_3.value, //id/passport
                input_6: f.input_6.value, //where you learn spark?
                input_4: f.input_4.value, //street
                input_5: f.input_5.value, //number
                input_7: f.input_7.value, //floor
                input_9: f.input_9.value, //door
                input_10: f.input_10.value, //postal code
                input_11: f.input_11.value, //city
                input_12: f.input_12.value, //province
                input_38: f.input_38.value, //country
                input_22: f.input_22.value, //telephone
                input_13: f.input_13.value, //mail
                input_36: f.input_36.value, // ??? shipping
                input_8: f.input_8.value, // payment method
                input_27: this.total, //total
                "input_14.1": f.choice_8_14_1.value, //checkbox
                is_submit_8: f.is_submit_8.value,
                gform_submit: f.gform_submit.value,
                state_8: f.state_8.value,
                gform_target_page_number_8: f.gform_target_page_number_8.value,
                gform_source_page_number_8: f.gform_source_page_number_8.value
            } 
        }
        if(f.input_26.value == 'Spark MasterCard embossed with your name - 25€|25'){
            obj = {
                input_26: f.input_26.value, //type
                input_40: f.input_40.value, //personalized name
                input_1: f.input_1.value, //name
                input_2: f.input_2.value, //last name
                input_3: f.input_3.value, //id/passport
                input_6: f.input_6.value, //where you learn spark?
                input_4: f.input_4.value, //street
                input_5: f.input_5.value, //number
                input_7: f.input_7.value, //floor
                input_9: f.input_9.value, //door
                input_10: f.input_10.value, //postal code
                input_11: f.input_11.value, //city
                input_12: f.input_12.value, //province
                input_38: f.input_38.value, //country
                input_22: f.input_22.value, //telephone
                input_13: f.input_13.value, //mail
                input_41: f.input_41.value, // ??? shipping
                input_8: f.input_8.value, // payment method
                input_27: this.total, //total
                "input_14.1": f.choice_8_14_1.value, //checkbox
                is_submit_8: f.is_submit_8.value,
                gform_submit: f.gform_submit.value,
                state_8: f.state_8.value,
                gform_target_page_number_8: f.gform_target_page_number_8.value,
                gform_source_page_number_8: f.gform_source_page_number_8.value
            } 
        }

        
        let postData =  JSON.stringify(obj);
        


        if(error==""){
            return new Promise((resolve, reject) => {
                let headers = new Headers();
                let url = 'https://www.tarjetaspark.es/en/order/';
                
                
                headers.append('Content-Type', 'application/json');
                headers.append('enctype', "multipart/form-data");

                
                
                this.http.post(url, postData, {headers: headers}).subscribe(async res =>{
                    resolve(res.json()); // test this
                    
                    
                    console.log(res);
                    console.log(res.url);
                    
       
                    
                }, err =>{
                
                    err= err.json();
                    console.log(err);
                
                });
                
            });
            
        }
    }

    shippingType(type){
        
        this.shippingDisplay = type;
        if(this.input_26 == 'Spark MasterCard without name - 10€|10'){
            this.cardTypeValue = 10;
            this.shippingValue = 0;
            if(type == 'Tourline express|5'){
                this.shippingValue = 5;
            }
            this.total = this.cardTypeValue + this.shippingValue;
        }
        if(this.input_26 == 'Spark MasterCard embossed with your name - 25€|25'){
            this.cardTypeValue = 25;
            this.total = this.cardTypeValue;
        }
    }
    openExternal(){
        const shell = require('electron').shell;
        
        shell.openExternal('https://www.tip-sa.com/envios-de-paquetes/urgente-14-horas');
    }
    terms(txHash){
        const shell = require('electron').shell;
        
        shell.openExternal('https://www.tarjetaspark.es/wp-content/uploads/2018/05/180424_booklet_esp_completo.pdf');
    }
    privacy(txHash){
        const shell = require('electron').shell;
        
        shell.openExternal('https://www.tarjetaspark.es/en/privacy/');
    }
}
