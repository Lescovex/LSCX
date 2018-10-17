import * as EthUtils from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';
export class PendingTx {
    hash: string;
    nonce: number;
    from: string;
    to: string;
    value: number;
    gas: number;
    gasPrice:number;
    input: string;
    timeStamp: number;
    constructor(hash: string, tx: EthTx, to: string, amount:number, address: string){
        this.hash = hash;
        this.nonce = EthUtils.bufferToInt(tx.nonce);
        this.from = address;
        this.to = to;
        this.value = amount;
        this.gas = EthUtils.bufferToInt(tx.gasLimit);
        this.gasPrice = parseInt(EthUtils.bufferToHex(tx.gasPrice));
        this.input = EthUtils.bufferToHex(tx.data);
        this.timeStamp = Date.now()/1000
    }
}