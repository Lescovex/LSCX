
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
	nonce: number;
	amountBaseDecoded:number;
	
    constructor(side, tokenGet, tokenGive, amount, total, price, myAccount, user, nonce, _amountBaseDecoded? ){
        this.txHash = null;
		this.tokenAddr = (tokenGet != '0x0000000000000000000000000000000000000000')? tokenGet : tokenGive;
		this.side = side;
		this.date = Date.now();
		this.amount = amount;
		this.amountBase = total;
		this.price = price;
		this.buyer = (this.side == 'buy') ? myAccount : user;
		this.seller = (this.side == 'sell') ? myAccount : user;
		this.nonce = nonce;
		this.show = false;
		this.amountBaseDecoded = _amountBaseDecoded;
    }
}