import { Injectable } from '@angular/core';

import { Web3 } from './web3.service'
import { AccountService } from './account.service';
import { EtherscanService } from './etherscan.service';
import { ContractService } from './contract.service';

@Injectable()
export class LSCXContractService {
	contracts=['LSCX_ABT', 'LSCX_CYC', 'LSCX_ISC', 'LSCX_CIF'];
	abis = [];
	bytecodes = [];
	type = "";
	contract;
	contractInfo: any = {};
	contractHist = [];
	functions = [];
	moreInfo = [];

	constructor(private _web3 : Web3, private _account: AccountService, private _scan: EtherscanService, private _contract: ContractService){	
		this.getAbisadnBytecodes();
	}

	reset(){
		this.contractInfo = {};
		this.contractHist = [];
		this.contract = null;
		this.functions = [];
		this.moreInfo=[];
	}

	getAbisadnBytecodes(){
		for(let i=0; i<this.contracts.length;i++){
			this.abis[i] = require('../../LSCX-contracts/'+this.contracts[i]+'.json');
			this.bytecodes[i] = require('../../LSCX-contracts/'+this.contracts[i]+'_bytecode.json')
		}
	}
	
	async getAbi(file){
		let i = this.contracts.findIndex(x=> x==file);
		return this.abis[i]; 
	}

	async setAbi(file){	
		this.type = file;
		this.contract.abi = await this.getAbi(file);
	}

	
	async contractInstance(file, address){
		let abi = await this.getAbi(file);
		let contract = this._contract.contractInstance(abi, address)
		return contract;
	}

	async setContract(contract){
		this.type = contract.type;
		this.contractInfo = contract;
		this.contract = await this.contractInstance(contract.type, contract.address)
		let history = await this._scan.getHistory(contract.address);
		for(let i =0; i<history.length; i++){
			let date = this._scan.tm(history[i].timeStamp);
			history[i].date = date;
		  }
		this.contractHist = history;
		this.moreInfo= await this.getContractData(); 
	}
	async callFunction(contractInst, functionName:string, params){
		return await this._contract.callFunction(contractInst, functionName, params);
	}

	getFunctionData(functionName:string, params?){
		if(typeof(params)== 'undefined'){
			params= []
		}
		return this._contract.getFunctionData(this.contract,functionName, params)
	}

	async getBytecode(file:string){
		let i = this.contracts.findIndex(x=> x==file);
		let source : any = this.bytecodes[i];
		let bytecode = source.object;
		return bytecode;
	}


	async getContractModelData(type:string, address:string){
		let abi =  this.getAbi(type);
		let myContract = await this.contractInstance(type, address);
		let info: any = {};
		info.name = await this._contract.callFunction(myContract, 'name',[]);
		info.totalSupply = await this._contract.callFunction(myContract, 'totalSupply',[]);
		info.symbol = await this._contract.callFunction(myContract, 'symbol',[]);
		
		return info;
	}

	async getContractData(): Promise<any[]>{
		
		let functions = this.contract.abi.filter(data=>{
			return data['constant']==true && data['inputs'].length==0 && data.name!='name' && data.name!= 'totalSupply' && data.name !='symbol' && data.name!= 'standard' && data.name != 'decimals'
		});
		functions = this.addDecimals(functions)
		let info =[];
		for(let i = 0; i<functions.length; i++) {
			let result = await this._contract.callFunction(this.contract, functions[i].name,[]);
			let value = result.toString()
			if(functions[i].decimals == "decimals"){
				let number = parseInt(value) /Math.pow(10,this.contractInfo.decimals);
				let zero = '0'
				result = number.toLocaleString('en') + "."+zero.repeat(this.contractInfo.decimals)
			}else if(functions[i].decimals == "eth"){
				let number = this._web3.web3.fromWei(parseInt(value),'ether')
				result = number.toLocaleString('en')
			}
			info.push([functions[i].name,result]);
		}
		return info;
	}

	getFunctions(): any[]{
		let txFunctions = this. getTransFunctions();
		let infoFunctions = this.getInfoFunctions();
		let functions = txFunctions.concat(infoFunctions);
		functions = this.addOnlyOwner(functions);
		functions = this.addDecimals(functions)

		return functions
	}

	getTransFunctions(): any[]{
		let functions = this.contract.abi.filter(data => data.constant == false);
		return functions
	}

	getInfoFunctions(): any[]{
		let functions = this.contract.abi.filter(data => data['constant']==true && data['inputs'].length>0);
		return functions
	}

	addOnlyOwner(functions): any[]{
		let onlyOnwner:any = {
			LSCX_ABT : ["transferOwnership"],
			LSCX_CIF : ["transferOwnership", "deposit", "setPrice"],
			LSCX_CYC : ["renounceOwnership"],
			LSCX_ISC : ["transferOwnership", "setHoldTime","setHoldMax", "deposit", "withdraw"]
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
	
	addDecimalsConst(inputs, type): any[]{
		inputs.forEach(input=>{
			if(input.name ==  'initialSupply'){
				input.decimals = "decimals"
			}
		});
		switch(type){
			case "LSCX_ABT":
				inputs.forEach(input=>{
					if(input.name ==  'price'){
						input.decimals = "eth"
					}
				});
				break;

			case "LSCX_CIF":
				inputs.forEach(input=>{
					if(input.name ==  'contractMaxSupply'){
						input.decimals = "decimals"
					}
				});
				break;
		}
		return inputs
	}

	addDecimals(functions):any[]{
		let inputsDecimals:any = {
			LSCX_ABT : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  requestWithdraw:"value", decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LSCX_CIF : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LSCX_CYC : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue"},
			LSCX_ISC : {approve: "_value", approveAndCall:"_value" , transferFrom:"_value",  decreaseApproval:"_subtractedValue", transfer:"_value", increaseApproval:"_addedValue", withdraw: "value"}
		}
		
		let outputsDecimals: any = {
			LSCX_ABT : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit"],
			LSCX_CIF : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit", "requestWithdraws", "maxSupply", "holdedOf"],
			LSCX_CYC : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit"],
			LSCX_ISC : ["totalSupply", "balances", "balanceOf", "allowance", "tokenUnit", "contractBalance", "holdedOf"],
		}
		let inputsEth: any = {
			LSCX_ABT : {},
			LSCX_CIF : {setPrice:"_value"},
			LSCX_CYC : {},
			LSCX_ISC : {}

		}
		let outputsEth: any = {
			LSCX_ABT : ["tokenPrice"],
			LSCX_CIF : ["tokenPrice", "contractBalance",],
			LSCX_CYC : [],
			LSCX_ISC : [],
		}

		functions.forEach(funct=>{
			if(!funct.constant){
				if(inputsDecimals[this.type].hasOwnProperty(funct.name)){
					funct.inputs.forEach(input=>{
						if(input.name ==  inputsDecimals[this.type][funct.name]){
							input.decimals = "decimals";
						}else{
							input.decimals = "none"
						}
					});	
				}else if(inputsEth[this.type].hasOwnProperty(funct.name)){
					funct.inputs.forEach(input=>{
						if(input.name ==  inputsEth[this.type][funct.name]){
							input.decimals = "eth";
						}else{
							input.decimals = "none"
						}
					});
				}else{
					funct.inputs.forEach(input=>{ input.decimals = "none"});
				}
			}
			if(funct.constant){
				if(outputsDecimals[this.type].findIndex(item=> item == funct.name) != -1){
					funct.decimals = "decimals"
				}else if(outputsEth[this.type].findIndex(item=> item == funct.name) != -1){
					funct.decimals = "eth"
				}else {
					funct.decimals = "none"
				}
			}
		})

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
      		if(typeof(result)!= 'undefined' && result.contractAddress.toLowerCase() == cAddress.toLowerCase()){
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