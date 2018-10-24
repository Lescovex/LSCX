import { Injectable } from '@angular/core';

import { Web3 } from './web3.service';
import { ContractService } from './contract.service';

import { Order } from '../models/order';

@Injectable()
export class LSCXMarketStorageService {
    contract;
    constructor(private _web3: Web3, private _contract: ContractService) {
        this.setContract();
    }
    getAbi() {
        return require('../../LSCX-contracts/Lescovex_MarketStorage.json');
    }

    setContract() {
        let ADDRESSES = {
			1:"0x7b74ad8391111b3d71d95fef3b32b333f1f5d6c0",
			3:"0x338692dfa7a3c6455b25daa831229a949f320844",
			42: "0x3104F5cB240d642e3FF5b8829747c6fD9E34A33c"
		}
		let address = ADDRESSES[this._web3.network.chain]
		this.contract = this._contract.contractInstance(this.getAbi(), address);
    }

    async getTikers(tikersId) {
        let i = 1;
        if(tikersId != null) {
            i = tikersId;
        }
        let respIds = await this.callFunction("tikersId",[]);
        let ids = parseInt(respIds.toString());
        let newTikers = [];
        for(i; i<=ids; i++){
            let rowTikers = await this.callFunction("tikers",[i]);
            let tikersStr = rowTikers.toString();
            let tikers = tikersStr.split("*****");           
            tikers.map(x=>{
                try {
                    let y = x.replace(/'/g,'"');
                    newTikers.push(JSON.parse(y));
                }catch(e){
                    newTikers.push(null);
                }
            });           
        }
        let lastId = await this.callFunction("tikersId",[]);
        return {tikers:newTikers, tikersId :parseInt(lastId.toString())};
    }

    async getBuyOrders(token) {
        let respBuy= await this.callFunction("getOrdersToBuy",[token.addr]);
        return this.convertOdersResponseToOrder(respBuy, token)

    }

    async getSellOrders(token) {
        let respSell= await this.callFunction("getOrdersToSell",[token.addr]);
        return this.convertOdersResponseToOrder(respSell, token)
        
    }

    convertOdersResponseToOrder(resp, token): Order[]{
        let respStr = resp.toString();
        let orders = respStr.split("*****");
        let newOrders = [];
        orders.forEach(x=> {
            try {
                let y = x.replace(/'/g,'"');
                newOrders.push(new Order(JSON.parse(y),token.decimals));
            }catch(e){
            }
        })
        return newOrders;
    }

    async callFunction(functionName, params) {
        return await this._contract.callFunction(this.contract,functionName,params);
    }

}