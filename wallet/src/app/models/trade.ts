
import { BigNumber } from 'bignumber.js';
export class Trade {
    txHash: string;
	tokenAddr: string;
	side;
	date:Date;
	amount: number;
	amountBase:number;
	price: number;
	buyer: string;
	seller: string;
	
    constructor(object){
        this.txHash = object.txHash;
		this.tokenAddr = object.tokenAddr;
		this.side = object.side;
		this.date = new Date(object.date);
		this.amount = Number(object.amount);
		this.amountBase = Number(object.amountBase);
		this.price = Number(object.price);
		this.buyer = object.buyer;
		this.seller = object.seller
    }
}