
import { BigNumber } from 'bignumber.js';
export class Trade {
    txHash: string;
	tokenAddr: string;
	side;
	date:number;
	amount: number;
	amountBase:number;
	price: number;
	buyer: string;
	seller: string;
	show: boolean;
	
    constructor(object){
        this.txHash = object.txHash;
		this.tokenAddr = object.tokenAddr;
		this.side = object.side;
		this.date = Date.now();
		this.amount = Number(object.amount);
		this.amountBase = Number(object.amountBase);
		this.price = Number(object.price);
		this.buyer = object.buyer;
		this.seller = object.seller
		this.show = false;
    }
}