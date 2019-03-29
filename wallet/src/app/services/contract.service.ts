import { Injectable } from '@angular/core';

import { Web3 } from './web3.service'

const fs = require('fs')

@Injectable()
export class ContractService {

	constructor(private _web3 : Web3){

	}

	async getAbi(path){
		return require(path)
	}

	contractInstance(abi, address){
		let contract = this._web3.web3.eth.contract(abi).at(address);
		return contract;
	}

	async callFunction(contractInst, functionName:string, params){
		return new Promise (function (resolve, reject) {
			contractInst[functionName].call(...params, function(err, res){
				if (err) {
					//console.log("callfunction error?????"+functionName,err);
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}

	getFunctionData(contractInst,functionName:string, params?){
		return contractInst[functionName].getData(...params);
	}
}