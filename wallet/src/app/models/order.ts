import { BigNumber } from 'bignumber.js';

export class Order {
    txHash: string; 
    user: string;
    tokenGet: string;
    amountGet: BigNumber;
    tokenGive: string;
    amountGive: BigNumber;
    expires: number;
    nonce: number;s
    deleted: boolean;  
    amount: number;//token amount
    amountBase: number;//Eth amount
    price: number;
    amountFilled: number;
    available: number;
    tokenDecimals:number;
    show: boolean;
    date: number;
    
    constructor(object: any, tokenDecimals: any){
        this.user = object.user;
        this.tokenGet = object.tokenGet;
        this.amountGet = object.amountGet;
        this.tokenGive = object.tokenGive;
        this.amountGive = object.amountGive;
        this.expires = object.expires; 
		this.nonce = object.nonce;
        this.txHash = object.txHash;

        if('show' in object) {
            this.show = object.show;
        } else{
            this.show = false;
        }
        this.deleted = ('deleted' in object)? object.deleted : false;
        this.setTokenDecimals(tokenDecimals);
        this.setAmountBaseAndAmount(object);
        this.setPrice(object);
        if('amountFilled' in object) {
            this.amountFilled = object.amountFilled;
            this.available = object.available;
        }else {
            this.setFilled(0);
        }
        

    }

    private setAmountBaseAndAmount(object){
        if('amount' in object && 'amountBase' in object){
            this.amount = object.amount;
            this.amountBase = object.amountBase;

        }else{
            if(this.tokenGive=="0x0000000000000000000000000000000000000000"){
                this.setBuy(object);
            } 
            if(this.tokenGet=="0x0000000000000000000000000000000000000000"){
                this.setSell(object);
            }
        }
    }

    private setBuy(object){
        this.amount = this.toEth(object.amountGet, this.tokenDecimals).toNumber(); 
        this.amountBase = this.toEth(object.amountGive, 18).toNumber();
        

    }

    private setSell(object){
        this.amount = this.toEth(object.amountGive, this.tokenDecimals).toNumber();
        this.amountBase = this.toEth(object.amountGet, 18).toNumber();
    }

    private setTokenDecimals(tokenDecimals){
        this.tokenDecimals = tokenDecimals;
    }

    private setPrice(object) {
        if('price' in object){
            this.price = object.price;
        } else {
            this.price = this.amountBase/this.amount;
        }
    }

    setFilled(amountfilled) {
        if(this.tokenGive=="0x0000000000000000000000000000000000000000"){
            this.amountFilled =  this.toEth(amountfilled, this.tokenDecimals).toNumber();
            this.available = this.amount - this.amountFilled;
        }
        if(this.tokenGet=="0x0000000000000000000000000000000000000000"){
            this.amountFilled =  this.toEth(amountfilled, 18).toNumber();
            this.available = this.amountBase - this.amountFilled;
        }
    }

    checkExpires(blockNumber){
        if(this.expires>blockNumber) {
            this.deleted = true;
            this.date = Date.now();
        }
    }

    toEth(wei, decimals) {
		return 	new BigNumber(String(wei))
		.div(new BigNumber(10 ** decimals));
    }
}