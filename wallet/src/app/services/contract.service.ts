import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Web3 } from './web3.service'
import { AccountService } from './account.service';
import { EtherscanService } from './etherscan.service';

const fs = require('fs')

@Injectable()
export class ContractService {
	contracts=['LCX_ABT', 'LCX_CYC', 'LCX_ISC', 'LCX_CIF'];
	type = "";
	abi;
	contract;
	contractInfo: any = {};
	contractHist = [];
	moreInfo = [];

	constructor(private _web3 : Web3, private _account: AccountService, private http: Http, private _scan: EtherscanService){	
	}
	reset(){
		this.contractInfo = {};
		this.contractHist = [];
		this.contract = null;
		this.abi=[];
		this.moreInfo=[];
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
		this.type = file;
		this.abi = await this.getAbi(file);
	}

	
	async contractInstance(file, address){
		await this.setAbi(file);
		let contract = this._web3.web3.eth.contract(this.abi).at(address);
		return contract;
	}

	async setContract(contract){
		this.contractInfo = contract;
		this.contract = await this.contractInstance(contract.type, contract.address);
		let history = await this._scan.getHistory(contract.address);
		for(let i =0; i<history.length; i++){
			let date = this._scan.tm(history[i].timeStamp);
			history[i].date = date;
		  }
		this.contractHist = history;
		this.moreInfo= await this.getContractData(); 
	}

	async getBytecode(file:string){
		let solPromise = new Promise (function (resolve, reject) {
			fs.readFile('./src/LCX-contracts/'+file+'_bytecode.json', 'utf8', function (err,data) { 
				if(data=="" || typeof(data)=='undefined'){
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

	async callFunction(contractInst, functionName:string, params){
		return new Promise (function (resolve, reject) {
			contractInst[functionName].call(...params, function(err, res){  
				if (err) {
					reject(err);
				} else {
					resolve(res.toString());
				}
			});
		});
	}

	async getFunctionData(functionName:string, params?){
		let self =  this;
		return self.contract[functionName].getData(...params);
	}

	async getContractModelData(type:string, address:string){
		let myContract = await this.contractInstance(type, address);
		let info: any = {};
		info.name = await this.callFunction(myContract, 'name',[]);
		info.totalSupply = await this.callFunction(myContract, 'totalSupply',[]);
		info.symbol = await this.callFunction(myContract, 'symbol',[]);
		
		return info;
	}

	async getContractData(): Promise<any[]>{
		let functions = this.abi.filter(data=>{
			return data['constant']==true && data['inputs'].length==0 && data.name!='name' && data.name!= 'totalSupply' && data.name !='symbol' && data.name!= 'standard' && data.name != 'decimals'
		});
		let info =[];
		for(let i = 0; i<functions.length; i++) {
			info.push([functions[i].name,await this.callFunction(this.contract, functions[i].name,[])]);
		}
		return info;
	}

	getTransFunctions(): any[]{
		let functions = this.abi.filter(data => data.constant == false);
		
		return this.addOnlyOwner(functions);
	}

	getInfoFunctions(): any[]{
		let functions = this.abi.filter(data => data['constant']==true && data['inputs'].length>0);

		return this.addOnlyOwner(functions);
	}

	addOnlyOwner(functions): any[]{
		let onlyOnwner:any = {
			LCX_ABT : ["transferOwnership"],
			LCX_CIF : ["transferOwnership", "deposit", "setPrice"],
			LCX_CYC : ["renounceOwnership"],
			LCX_ISC : ["transferOwnership", "setHoldTime","setHoldMax", "deposit", "withdraw"]
		}
		functions.forEach(funct=>{
			if(onlyOnwner[this.type].findIndex(name=>name==funct.name)!= -1){
				funct.onlyOwner = true;
			}else{
				funct.onlyOwner = false;
			}
		})
		return functions;
	}

	addDecimals(functions):any[]{
		let inputsDecimals:any = {
			LCX_ABT : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  requestWithdraw:"value", decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LCX_CIF : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LCX_CYC : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LCX_ISC : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue", withdraw: "value"}
		}
		
		let otuputsdecimals: any = {
			LCX_ABT : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit"],
			LCX_CIF : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit", "requestWithdraws", "maxSupply", "holdedOf"],
			LCX_CYC : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit"],
			LCX_ISC : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit", "contractBalance", "holdedOf"],
		}
		let inputsWeis: any = {
			LCX_ABT : {},
			LCX_CIF : {setPrice:"_value"},
			LCX_CYC : {},
			LCX_ISC : {}

		}
		let outputsEth: any = {
			LCX_ABT : ["tokenPrice"],
			LCX_CIF : ["tokenPrice", "contractBalance",],
			LCX_CYC : [],
			LCX_ISC : [],
		}
		functions
		return functions;
	}


	getConstructor(abi): Array<any>{
		let constructor = abi.find(data=> data.type == "constructor");

		return constructor.inputs
	}

	async getDeployContractData(type, bytecode:string, args:any[]){
		let abi = await this.getAbi(type);
		let myContract = this._web3.web3.eth.contract(abi)
		let result = myContract.new.getData(...args, {data: bytecode});
		return result
	}

	async checkContract(cAddress:string){
		let response : any = await this._scan.getTx(cAddress).toPromise();
		if (response.status == 1){
			let result = response.result[0];
      		if(typeof(result)!= 'undefined' && result.contractAddress == cAddress){
				  return result
			}else{
				return false
			}
		}else{
			return false
		}
		
	}

	async checkType(data:string): Promise<string>{
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