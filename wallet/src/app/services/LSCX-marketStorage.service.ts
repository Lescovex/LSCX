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
			1:"0xb718339A3b090d68a91Ca80cEf7AdF8A69ff2421",
			3:"0xdaaaf70c3078aaccee60ef9ff7a88fe8fbb114fe",
			42: "0xdfd71c0b6d75b8cee94e8ca017104424c0efdd47"
		}
		let address = ADDRESSES[this._web3.network.chain]
		this.contract = this._contract.contractInstance(this.getAbi(), address);
    }

    async getTikers(tikersId) {
        let i = 1;
        let network = this._web3.network.chain;
        //console.log(network)
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

        //console.log(newTikers)
        let lastId = await this.callFunction("tikersId",[]);
        return {tikers:newTikers, tikersId :parseInt(lastId.toString()), network: network};
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