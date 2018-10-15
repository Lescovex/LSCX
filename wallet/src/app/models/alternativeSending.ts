const bip39 = require('bip39');
const hdkey = require('hdkey');
import * as EthUtil from 'ethereumjs-util';
import { Web3 } from '../services/web3.service';

export class AlternativeTx{
    private _address: string;
    private _seed: string;
    constructor(seed:string) {
        this._seed = seed;
        this.setAddress();
    }

    getPrivKey(): string{
        let seed = bip39.mnemonicToSeed(this.seed);
        const hdwallet = hdkey.fromMasterSeed(seed);
        const privateKey= hdwallet.privateKey;
        return EthUtil.bufferToHex(privateKey);
    }

    setAddress() {
        let priv = this.getPrivKey();
        this._address = EthUtil.bufferToHex(EthUtil.privateToAddress(priv));
    }

    get address(): string {
        return this._address;
    }

    get seed(): string {
        return this._seed;
    }
}

export class AlternativeSending extends AlternativeTx{
    to: string;
    from: string;
    seed: string;
    hash: string;
    amount: string;
    timeStamp: number;
    recover: boolean;
    network: number;

    constructor(seed:string, to: string, from: string, hash:string, amount: string, network: number) {
        super(seed);
        this.to =  to;
        this.from = from;
        this.hash = hash;
        this.amount = amount;
        this.network = network;
        this.timeStamp = null;
        this.recover = false;
    }

    async isReceived(): Promise<boolean>{
        let _web3 = new Web3();
        let balance = await _web3.getBalance(this.address);
        let isReceived = (balance==0)? true : false
        return isReceived;
    }

    checkTimeStamp(accountTxs: any[]){
        let tx = accountTxs.find(x=> x.hash.toLowerCas() == this.hash.toLowerCase());
        if( tx != null ) {
            this.timeStamp = tx.timeStamp;
        }

    }

    checkRecover(){
        if(this.timeStamp!=null){
            let dayInSec = 86400000;
            if(this.timeStamp+30*dayInSec >= Date.now()/1000){
                this.recover = true;
            }
        }
    }
}