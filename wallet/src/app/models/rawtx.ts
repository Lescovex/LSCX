import { Web3 } from '../services/web3.service';
import * as EthUtils from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';
import BigNumber from 'bignumber.js';

export class BaseRawTx {
    tx: EthTx;
    cost: number;
    gas: number;
    amount: number;

    constructor(to: String, amount: BigNumber, gasLimit: number, gasPrice:number,  networkObj:any) {
        let txParams: any = {
            gasPrice: "0x"+gasPrice.toString(16),
            gasLimit: gasLimit,
            to: to,
            value: "0x"+amount.toString(16),
            chainId:networkObj.chain
        }
        console.log(txParams)
        this.tx = new EthTx(txParams);
        this.gas = gasPrice*gasLimit;
        this.cost = amount.plus(this.gas).toNumber();
        this.amount = amount.toNumber();
    }

    async setTxNonce(account: any){
        let _web3 = new Web3();
        let nonce = await _web3.getNonce(account.account.address);
        console.log("web3 nonce", nonce) 

        let history = account.account.history.filter(x=> x.from.toLowerCase() == account.account.address);
        if(history.length > 0) {
            let historyNonce =history[0].nonce;
            if(historyNonce>= nonce){
                nonce = parseInt(historyNonce)+1;
            }
        }

        
        this.tx.nonce = nonce;
    }
    setTxData(data){
        this.tx.data = data;
    }
    async getNonce(): Promise<number>{
        return EthUtils.bufferToInt(this.tx.nonce);
    }

}

export class RawTx extends BaseRawTx {
    constructor(account: any, to: String, amount: BigNumber, gasLimit: number, gasPrice:number, networkObj:any, data: string) {
        super(to, amount, gasLimit, gasPrice, networkObj);
        super.setTxNonce(account).then();
        if(data!="") {
            super.setTxData(data);
        }
    }
}
export class RawTxIncrementedNonce extends BaseRawTx {
    constructor(account: any, to: String, amount: BigNumber, gasLimit: number, gasPrice:number, networkObj:any, data: string, nonceIncrement:number) {
        super(to, amount, gasLimit, gasPrice, networkObj);
        this.setIncrementedNonce(account,nonceIncrement);
        super.setTxData(data);
    }
    async setIncrementedNonce(account: any, nonceIncrement){
        let _web3 = new Web3();
        let nonce = await _web3.getNonce(account.account.address);  
        if(account.pending.length > 0){
            let pendingNonce = account.pending[account.pending.length-1].nonce;   
            if(pendingNonce >=  nonce){   
                nonce = pendingNonce+1;
            }
        }
        this.tx.nonce = nonce+nonceIncrement;
    }
}


export class DeployRawTx extends BaseRawTx{
    constructor(account: any, gasLimit: number, gasPrice:number, networkObj:any, data:string) {
        super("", new BigNumber(0), gasLimit, gasPrice, networkObj);
        super.setTxNonce(account).then();
        super.setTxData(data);
    }
}

export class ResendTx extends BaseRawTx{
    constructor(account: any, to: String, amount: BigNumber, gasLimit: number, gasPrice:number, networkObj:any, data: string, nonce:number) {
        super(to, amount, gasLimit, gasPrice, networkObj);
        this.tx.nonce = nonce;
        if(data!="") {
            super.setTxData(data);
        }
    }
}