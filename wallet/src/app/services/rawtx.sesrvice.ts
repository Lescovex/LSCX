import { Injectable} from '@angular/core';

import { AccountService } from './account.service';
import { Web3 } from './web3.service';

import * as EthUtil from 'ethereumjs-util';
import * as EthTx from 'ethereumjs-tx';

@Injectable()
export class RawTxService {
    constructor(private _account: AccountService, private _web3: Web3){

    }

    async createRaw(receiverAddr: string, amount: number, data?: string){

        let chainId = this._web3.network;
        let acc = this._account.account;
        let amountW = this._web3.web3.toWei(amount,'ether');
        let gasPrice  = this._web3.web3.toHex(this._web3.web3.toWei('1','gwei'));
        console.log("address", acc.address)
        let nonce = await this._web3.getNonce(acc.address);
        console.log("nonce", nonce)
        let gasLimit = await this._web3.estimateGas(acc, receiverAddr, data, amountW)
        console.log("estimate",gasLimit)
        
        let txParams = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: this._web3.web3.toHex(21000),
            to: receiverAddr,
            value: this._web3.web3.toHex(amountW),
            data: this._web3.web3.toHex(data),
            chainId:chainId
        }
        
        let tx = new EthTx(txParams);

        let cost = gasLimit*gasPrice+amountW;
        let balance =  this._web3.web3.toWei(this._account.account.balance,'ether');

        if(cost> balance){ 
            throw "Parameter is not a number!";
        }else{
            return [tx,cost,amountW]
        }

    }
    async contractCreationRaw(data: string){
        console.log('dentro')
        let chainId = this._web3.web3.toHex(this._web3.network);
        let acc = this._account.account;
        let gasPrice  = this._web3.web3.toHex(this._web3.web3.toWei('1','gwei'));
        let nonce = await this._web3.getNonce(acc.address);
        let gasLimit = await this._web3.estimateGas(acc.address,"", "0x"+data)

        
        let txParams = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            data: "0x"+data,
            chainId:chainId
        }
        
        let tx = new EthTx(txParams);
        console.log(txParams, tx)
        let cost = gasLimit*gasPrice;
        let balance =  this._web3.web3.toWei(this._account.account.balance,'ether');

        if(cost> balance){ 
            throw "Insuficient founds!";
        }else{
            return [tx, cost]
        }

    }
}