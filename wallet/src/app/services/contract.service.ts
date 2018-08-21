import { Injectable, APP_BOOTSTRAP_LISTENER} from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service'
import { AccountService } from './account.service';

const fs = require('fs')

@Injectable()
export class ContractService {
	contracts=['LCX_ABT', 'LCX_CYC', 'LCX_ISC', 'LCX_CIF']
	abi;
	contract;
	constructor(private _web3 : Web3, private _account: AccountService, private http: Http){
		
	}
	
	async getAbi(file){
		return new Promise (function (resolve, reject) {
			fs.readFile('./src/LCX-contracts/'+file+'.json', 'utf8', function (err,data) { 
				if(data=="" || typeof(data)=='undefined'){
					console.log(err)
					resolve(data); 
				}else{
					resolve(JSON.parse(data)); 
				}	
			});
		})	
	}

	async setAbi(file){	
		this.abi = await this.getAbi(file);
		console.log(this.abi)
		this.contract =this._web3.web3.eth.contract(this.abi)
		console.log("set abi",this.contract)
	}
	async contractInstance(file, address){
		await this.setAbi(file);
		let contract = this._web3.web3.eth.contract(this.abi).at(address);
		return contract;
	}

	async callFunction(contractInst, functionName, params?){
		return new Promise (function (resolve, reject) {
			contractInst[functionName].call(params,function(err, res){  
			if (err) {
				reject(err);
			} else {
				resolve(res.toString());
			}
		});
		});
	}

	async getBytecode(file){
		let solPromise = new Promise (function (resolve, reject) {
			fs.readFile('./src/LCX-contracts/'+file+'_bytecode.json', 'utf8', function (err,data) { 
				if(data=="" || typeof(data)=='undefined'){
					console.log(err)
					return resolve(data); 
				}else{
					resolve(JSON.parse(data)); 
				}
				
			});
		})
		let source : any = await solPromise;
		let bytecode = source.object;
		return bytecode;
	}
	async getContractModelData(type, address){
		let myContract = await this.contractInstance(type, address);
		let info: any = {};
		info.name = await this.callFunction(myContract, 'name');
		info.totalSupply = await this.callFunction(myContract, 'totalSupply');
		info.symbol = await this.callFunction(myContract, 'symbol');
		
		return info;
	}

	async getContractData(type, address){
		let myContract = await this.contractInstance(type, address);
		let functions=new Array();
		for (let i = 0; i < this.abi.length;i++) {
			if(this.abi[i]['constant']==true && this.abi[i]['inputs'].length==0){
				if(this.abi[i].name!='name' && this.abi[i].name!= 'totalSupply' && this.abi[i].name!='symbol'){
					functions.push(this.abi[i]['name']);
				}
			}
		}
		for(let i = 0; i<functions.length; i++) {

		}
			//return JSON.stringify(variables);	
	}

	getFunctions(){

	}

	getDataView(){

	}

	getConstructor(): Array<any>{
		let cdata=this.abi;
		let constructor = this.abi.find(data=> data.type == "constructor");

		return constructor.inputs
	}

	getDeployContractData(bytecode,args){
		return this.contract.new.getData(...args, {data: bytecode})
	}

	checkContract(cAddress){
		let url = 'http://api-ropsten.etherscan.io/api?module=account&action=txlist&address='+cAddress+'&startblock=0&endblock=99999999&sort=asc&apikey='+this._account.apikey;
		return this.http.get(url).map(res => res.json());
	}

	async checkType(data): Promise<string>{
		console.log(data)
		let type = "";
		for(let i=0; i<this.contracts.length; i++){
			let byteCode = await this.getBytecode(this.contracts[i]);
			if(data.indexOf(byteCode)!=-1){
				return this.contracts[i]
			}
		}
		return type;
	}
	
}