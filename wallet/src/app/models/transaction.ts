export class Transaction {
    to:string;
    value: number;
    nonce : number;
    gas:number;
    gasPrice: number;
    input: string;

    constructor(obj){
        this.to = obj.to;
        this.value = parseInt(obj.value);
        this.nonce  = obj.nonce;
        this.gas = obj.gas;
        this.gasPrice = obj.gasLimit;
        this.input = obj.input;
    }
}
