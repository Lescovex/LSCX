import { Injectable} from '@angular/core';

import { AccountService } from './account.service';
import { Web3 } from './web3.service';

import * as EthTx from 'ethereumjs-tx';

@Injectable()
export class RawTxService {
    constructor(private _account: AccountService, private _web3: Web3){

    }

    async createRaw(receiverAddr: string, amount: number, options?: any){
        if(typeof(options)=='undefined'){
            options = {}
        }
        let data = "";
        let gasLimit;
        let chainId = this._web3.web3.toHex(this._web3.network);
        let acc = this._account.account;
        let amountW = parseInt(this._web3.web3.toWei(amount,'ether'));
        let gasPrice  = parseInt(this._web3.web3.toWei('5','gwei'));
        let nonce = await this._web3.getNonce(acc.address);
        if('data' in options){
            data = options.data;
        }
        if('gasLimit' in options){
            gasLimit = options.gasLimit
        }else{
            try{
                gasLimit = await this._web3.estimateGas(acc.address, receiverAddr, data, amountW)
            }catch(e){
                gasLimit = await this._web3.blockGas();
            }
        }
        if('gasPrice' in options){
            gasPrice = options.gasPrice;
        }
        if('nonce' in options){
            nonce += options.nonce
        }
        
        //console.log("estimate",gasLimit, "price", gasPrice)

        let txParams: any = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            to: receiverAddr,
            value: amountW,
            chainId:chainId
        }
        if(data != ""){
            txParams.data = this._web3.web3.toHex(data)
        }
        //console.log(txParams)

        
        let tx = new EthTx(txParams);
        //console.log(gasLimit,gasPrice,amountW)
        let cost = gasLimit*gasPrice+amountW;
        
        let balance =  await this._web3.web3.toWei(this._account.account.balance,'ether');
        balance = parseInt(balance);
        //console.log(cost ,balance)

        return [tx,cost,amountW]

    }

    async contractCreationRaw(options){
        //console.log('dentro')
        let chainId = this._web3.web3.toHex(this._web3.network);
        let acc = this._account.account;
        let nonce = await this._web3.getNonce(acc.address);
        let gasPrice  = this._web3.web3.toHex(this._web3.web3.toWei(options.gasPrice,'gwei'));
        let gasLimit = options.gasLimit

        
        let txParams = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            data: "0x"+options.data,
            chainId:chainId
        }
        
        let tx = new EthTx(txParams);
        //console.log(txParams, tx)
        let cost = gasLimit*gasPrice;
        let balance =  this._web3.web3.toWei(this._account.account.balance,'ether');
        
        return [tx, cost]

    }
}