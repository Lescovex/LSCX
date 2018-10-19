import { BigNumber } from 'bignumber.js';

export class Order {
    user: string;
    tokenGet: string;
    amountGet: BigNumber;
    tokenGive: string;
    amountGive: BigNumber;
    expires: number;
    nonce: number;
    hash: string;
    r;
    s;
    v;
    deleted: boolean;  
    amount: number;//token
    amountBase: number;//Eth
    price: number;
    
    constructor(object: any, token: any){
        this.user = object['0'];
        this.tokenGet = object['1'];
        this.amountGet = object['2'];
        this.tokenGive = object['3'];
        this.amountGive = object['4'];
        this.expires = object['5'].toNumber(); 
		this.nonce = object['6'];
        this.hash = object['7'];
        this.v = object['8'].toNumber();
		this.r = object['9'];
        this.s = object['10'];
        //CALCULAR this.price = object.price;
		
        this.deleted = ('deleted' in object)? true : false;
        if(this.tokenGive=="0x0000000000000000000000000000000000000000"){
            this.setBuy(object, token);
        } 
        if(this.tokenGet=="0x0000000000000000000000000000000000000000"){
            this.setSell(object, token);
        }

    }
    setBuy(object,token){
        this.amount = this.toEth(object.amountGet, token.decimals).toNumber(); 
		this.amountBase = this.toEth(object.amountGive, 18).toNumber(); 

    }
    setSell(object,token){
        this.amount = this.toEth(object.amountGive, token.decimals).toNumber();
		this.amountBase = this.toEth(object.amountGet, 18).toNumber();
    }
    setPrice() {
        this.price = this.amountBase/this.amount;
    }

    checkExpires(blockNumber){
        if(this.expires>blockNumber) {
            this.deleted = true;
        }
    }

    toEth(wei, decimals) {
		return 	new BigNumber(String(wei))
		.div(new BigNumber(10 ** decimals));
	}

}