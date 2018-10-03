export class Transaction {
    to:String;
    value: number;
    nonce : number;
    gas:number;
    gasPrice: number;
    input: String;

    constructor(obj){
        this.to = obj.to;
        this.value = parseInt(obj.value);
        this.nonce  = obj.nonce;
        this.gas = obj.gas;
        this.gasPrice = obj.gasLimit;
        this.input = obj.input;
    }
}
