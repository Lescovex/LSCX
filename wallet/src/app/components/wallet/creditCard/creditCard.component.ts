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

@Component({
  selector: 'cardPage',
  templateUrl: './creditCard.component.html',
})


export class CreditCardPage implements OnInit {
    public interval;

    //  sandbox:    'https://sandbox.chip-chap.com'
    //  production: 'https://api.chip-chap.com'

    private url:string = 'https://sandbox.chip-chap.com';

    public username:any;
    public password:any;  
    
    //private clientId :string = "21_5jfviud5jbgocw8w8kg44wosg4kw4wkg4sw04kwkwskswwcgo8"; //add 21_ to client_id
    //private clientSecret:string = "18s80pjcez6s8ks0444ok8ossskkw8ckc0o8scskkwkwkgoc8";

    //Credentials Variables
    private accessToken:string;
    private expiresIn:number;
    private scope:string;
    private tokenType:string;
    private credentials:JSON;

    //Eth pairs variables
  
    public EURxETH:number;
    public EURxBTC:number;

    public serviceStatus;
    public pendingTx;


    //input variables
    public inputAmount;
    public inputCardId;
    public inputExpectedAmount;

    public inputAmountErr;
    public inputCardIdErr;

    //Tx detail info
    public selfAccount; //eth account
    public fiatReceiver; //Card ID
    public fiatAmount;
    public tx_id:number;
    public ethAddr; //chipchap eth account
    public amountWei;
    public timeLeft;

    public cardDetailTx;
    public inputData;

    public loadingD;




    //Control status
    public checkResponseIn;
    public checkResponseOut;
    public checkResponseStatus;
    
    public txtResponseIn;
    public txtResponseOut;
    public txtResponseStatus;
    

    //public from; eth account?
    
    //send variables
    addr: string = "";
    privatek: string = "";
    receiverAddr: string = "";
    amount: number = 0;
    errors:any = {
        receiver:"",
        amount:""
    }


    constructor(private dialog: MdDialog, private http: Http, public _web3: Web3,private _account: AccountService, private sendDialogService: SendDialogService,  private _rawtx: RawTxService) {
       /* this.interval = setInterval(() =>{
            this.chipchapAccess().then(
              result => {
                  console.log("Auto Access");
                    }, err => {},
            );
          }, 3000000);*/
        

          if(localStorage.getItem('pendingTx')){
            let x = localStorage.getItem('pendingTx'); 
            this.tx_id = JSON.parse(x);
          }
        
    }
    async backPendingTx(){
        this.pendingTx = null;
        this.serviceStatus = true;
        this.inputData = true;
        await this.chipchapSwiftStatus();
        localStorage.removeItem('pendingTx');
    }
  
    async ngOnInit() {
        if(localStorage.getItem('pendingTx')){
            let x = localStorage.getItem('pendingTx'); 
            this.tx_id = JSON.parse(x);
            
            this.pendingTx = true;
            await this.chipchapSwiftResponse();
            

            
          
          }else{
            this.serviceStatus = true;
            this.inputData = true;
            this.chipchapSwiftStatus();
          }
    }

    setCredentials(data){
        let cred = JSON.parse(data);
        this.accessToken = cred.access_token;
        this.expiresIn = cred.expires_in;
        this.scope = cred.scope;
        this.tokenType = cred.token_type;
        this.credentials = data;

        console.log("credentials setted!");
        
    }
    setPublicTikerByEthCurrency(data){
        this.EURxETH = data;
    
    }
    setPublicTikerByBtcCurrency(data){
        this.EURxBTC = data;    
    }
   
    back(){
        this.inputData = true;
    }
  

    setServiceStatus(data){
        if(data == "available"){
            this.serviceStatus = true;
        }else{
            this.serviceStatus = false;
        }        
    }

    setTxInfo(tx, addr, q, t, to, s){
        this.tx_id = tx;
        this.ethAddr = addr;
        this.amountWei = q;
        this.timeLeft = t;
        this.fiatReceiver = to;
        this.selfAccount = this._account.account.address;
        
        this.fiatAmount = s;

        this.inputData = null;
        this.loadingD.close();
    }

    chipchapSwift(){
        let val = this.inputAmount;
        let where
        if(this.inputCardId != null){
            where = this.inputCardId.toString();
        } else{
            where = null;
        }
        
        if(this.serviceStatus){
            if(val < 10 || val == null){
                this.inputAmountErr = "Amount must be greater than 10";
            } else{
                this.inputAmountErr = null;
                document.getElementById("Amount").classList.remove("error");
            }
            if(where == null || where.length != 16){
                this.inputCardIdErr = "Spark ID length must be equal to 16";
            } else{
                this.inputCardIdErr = null;
                document.getElementById("CardId").classList.remove("error");
            }
            
            if(this.inputAmountErr ==null && this.inputCardIdErr == null){
                this.loadingD = this.dialog.open(LoadingDialogComponent, {
                    width: '660px',
                    height: '150px',
                    disableClose: true,
                  });

                //BEFORE PROD: change btc to eth
                //eth not avaiable in sandbox
                let path = "/swift/v1/btc/spark";
                
                let amountX = this.inputAmount*100;
                
                let userData = {"amount":amountX,"card_id":this.inputCardId};

                return new Promise((resolve, reject) => {
                    let headers = new Headers();
                    headers.append('Content-Type', 'application/json');
                    
                    this.http.post(this.url +  path, JSON.stringify(userData),  {headers: headers}).subscribe(res =>{
                        resolve(res.json());
                        let response = res.json();
                        console.log("response????",response);
                        
                        let txId = response.id;
                        let payIn = response.pay_in_info;
                        let payOut = response.pay_out_info;
                        
                        this.setTxInfo(txId,payIn.address, payIn.amount, payIn.expires_in, payOut.card_id, payOut.amount);
                                        
                    }, err =>{
                        console.log(err);
                        reject(err);
                        this.loadingD.close();
                    });
                });
            } else{
                if(this.inputAmountErr){
                    document.getElementById("Amount").classList.add("error");
                }
                if(this.inputCardIdErr){
                    document.getElementById("CardId").classList.add("error");
                }
                
            }
                
        }
        
    }

    //should change to eth in prod
    chipchapSwiftResponse(){
        //let path = "/swift/v1/btc/spark/"+this.tx_id;
        let path = "/swift/v1/btc/spark/5b91755dc13d8b7b488b4570"; //this force expired tx
        

            return new Promise((resolve, reject) => {
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            
            this.http.get(this.url +  path,  {headers: headers}).subscribe(res =>{
                resolve(res.json());
                
                let response = res.json();

                this.checkResponseStatus = response.status;
                this.checkResponseIn = response.pay_in_info.status;
                this.checkResponseOut = response.pay_out_info.status;

                console.log(this.checkResponseIn);
                console.log(this.checkResponseOut);
                console.log(this.checkResponseStatus);
           
                if(this.checkResponseIn == "expired"){
                    this.txtResponseIn = "Time is expired to pay in.";
                }
                if(this.checkResponseOut == true){
                    this.txtResponseOut = "Transaction has been success."
                }
                
                           
            }, err =>{
                console.log(err);
                reject(err);
            });
        });
    }

    chipchapSwiftStatus(){
        let path = "/swift/v2/hello/btc";
            //should change to eth in prod

            return new Promise((resolve, reject) => {
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            
            this.http.get(this.url +  path,  {headers: headers}).subscribe(res =>{
                resolve(res.json());
                let response = res.json();
                console.log("BEFORE PROD: should check parameters before to call setServiceStatus");

                this.setServiceStatus(response.swift_methods["btc-spark"].status);
                
            }, err =>{
                console.log(err);
                reject(err);
            });
        });
    }

    //prod function
    publicTikerByEthCurrencyChipChap(){
        let path = '/exchange/v1/ticker/eth';

            return new Promise((resolve, reject) => {
                let headers = new Headers();
                
                this.http.get(this.url + path, {headers: headers}).subscribe(res =>{
                    resolve(res.json());
                    
                    let response = res.json();
                   
                    let setData = JSON.stringify(response.data.EURxETH);
                    console.log("setdata???????????", setData);
                    
                    this.setPublicTikerByEthCurrency(setData);
                    
                }, err =>{
                    console.log(err);
                    reject(err);
                });
        });
    }
    //test function
    publicTikerByBtcCurrencyChipChap(){
        let path = '/exchange/v1/ticker/btc';

            return new Promise((resolve, reject) => {
                let headers = new Headers();
                let data = this.accessToken;
                
                headers.append('Authorization', data);
                
                this.http.get(this.url + path, {headers: headers}).subscribe(res =>{
                    resolve(res.json());
                    
                    let response = res.json();
                    
                    let setData = JSON.stringify(response.data.EURxBTC);
                    
                    
                    this.setPublicTikerByBtcCurrency(setData);
                    
                }, err =>{
                    console.log(err);
                    reject(err);
                });
        });
    }

    async checkChange(data){
        await this.publicTikerByEthCurrencyChipChap();
        
        this.inputExpectedAmount = this.EURxETH * data;
        console.log("expectedamount", this.inputExpectedAmount);
        
        
    }

    async sendEth(receiverAddr: string, amount: number, trans_data? : string) {
        //BEFORE PROD: change otherAddress to receiverAddr
        let otherAddress = "0x7df73b0fbc274766451111408673c442e04c3211";
        console.log("sendData:",otherAddress, amount);
        await this.chipchapSwiftStatus();

        let contador=0;

        if(this.checkAmount(amount) == false || this.checkAddress(otherAddress) == false){
            
            return false;
        }
        //change otherAmount to amount
        let otherAmount = 1;
        let tx =  await this._rawtx.createRaw(otherAddress, otherAmount);
        this.sendDialogService.openConfirmSend(tx[0], otherAddress, tx[2],tx[1]-tx[2], tx[1], "send");

        localStorage.setItem("pendingTx", JSON.stringify(this.tx_id));
        this.interval = setInterval(() =>{
            this.chipchapSwiftResponse().then(
              result => {
                  console.log("swift response", result);
                  console.log("check in", this.checkResponseIn);
                  console.log("check out",this.checkResponseOut);
                  console.log("check general status", this.checkResponseStatus);
                  
                  
                  
                this.pendingTx = true;
                this.serviceStatus = null;
                console.log(contador);
                contador++;
                    if(this.checkResponseOut == true){
                        clearInterval(this.interval);
                        this.pendingTx = null;
                        this.serviceStatus = true;
                        localStorage.removeItem("pendingTx");
                    }
                }, err => {},
            );
          }, 1000);
        

        
        
      }

      checkAddress(receiverAddr): boolean {
        if(!EthUtil.isValidAddress(receiverAddr)){
          this.errors.receiver = "invalid receiver address";
          console.log("invalid receiver addr");
          
          return false
        }else{
            console.log("valid receiver addr");
            
          this.errors.receiver =  "";
          return true
        }
    
      }
      checkAmount(amount):boolean{
        if(amount<0){
          this.errors.amount = "Can not send negative amounts of ETH";
          console.log("invalid amount");
          
          return false;
        }else{
          this.errors.amount ="";
          console.log("valid amount");
          
          return true;
        }
      }
}
