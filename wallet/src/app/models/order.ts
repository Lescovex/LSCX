import { BigNumber } from 'bignumber.js';

export class Order {
    id: string;
    date: Date;
    price: string;
    amountGet: BigNumber;
    amountGive: BigNumber;
    expires: number;
    nonce: number;
    tokenGet: string;
    tokenGive: string;
    user: string;
    deleted: boolean;
    r;
    s;
    v;
    amount: number;
    amountBase: number;
    availableVolume: number;
    ethAvailableVolume: number;
    availableVolumeBase: number;
    ethAvailableVolumeBase: number;

    constructor(object: any, type:string, token){
        this.amountGet = new BigNumber(object.amountGet);
        this.amountGive = new BigNumber(object.amountGive);
        this.tokenGet = object.tokenGet;
        this.tokenGive = object.tokenGive;
        this.id = object.id;
		this.date = new Date(object.updated);
		this.price = object.price;
		this.expires = Number(object.expires);
		this.nonce = Number(object.nonce);
		this.user = object.user;
		this.r = object.r;
		this.s = object.s;
		this.v = object.v ? Number(object.v) : undefined;
		this.availableVolume = Number(object.availableVolume);
		this.ethAvailableVolume = Number(object.ethAvailableVolume);
		this.availableVolumeBase = Number(object.availableVolumeBase);
        this.ethAvailableVolumeBase = Number(object.ethAvailableVolumeBase);
        this.deleted = ('deleted' in object)? true : false;
        if(type==='buy') this.setBuy(object, token)
        if(type==='sell') this.setSell(object, token)

    }
    setBuy(object,token){
        this.amount = this.toEth(object.amountGet, token.decimals).toNumber();
		this.amountBase = this.toEth(object.amountGive, 18).toNumber();

    }
    setSell(object,token){
        this.amount = this.toEth(object.amountGive, token.decimals).toNumber();
		this.amountBase = this.toEth(object.amountGet, 18).toNumber();
    }

    toEth(wei, decimals) {
		return 	new BigNumber(String(wei))
		.div(new BigNumber(10 ** decimals));
	}

}