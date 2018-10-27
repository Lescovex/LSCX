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
			1:"0x1759eb1272c5fbb6dfb2272665c375d04c82e347",
			3:"0x6b441859b6f92f5aed832f2ece858b156c286e4d",
			42: "0x51323783e5fbb38f73205ef73a08d4dfe495d690"
		}
		let address = ADDRESSES[this._web3.network.chain]
		this.contract = this._contract.contractInstance(this.getAbi(), address);
    }

    async getTikers(tikersId) {
        let i = 1;
        //console.log("getIkers storage");
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

        console.log(newTikers)
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