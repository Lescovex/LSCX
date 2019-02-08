import { Injectable } from '@angular/core';

import { Web3 } from './web3.service'
import { AccountService } from './account.service';
import { EtherscanService } from './etherscan.service';
import { ContractService } from './contract.service';
import { LSCXContractService } from './LSCX-contract.service';

@Injectable()
export class CustomContractService {
    contract;
	contractInfo: any = {};
    contractHist = [];
    functions = [];
    moreInfo = [];
    
    constructor(private _web3 : Web3, private _account: AccountService, private _scan: EtherscanService, private _contract: ContractService, protected _LSCXcontract: LSCXContractService){	
    
    }
    
    reset(){
		this.contractInfo = {};
		this.contractHist = [];
		this.contract = null;
		this.functions = [];
		this.moreInfo=[];
    }
    
    async setContract(abi, contract){
		this.contract = this._contract.contractInstance(abi,contract.address);
		console.log("this contract", this.contract);
		this.contractInfo = {address :contract.address, name: contract.name};
		console.log("this.contractInfo", this.contractInfo);
		this.moreInfo= await this.getContractData();
		console.log("this.moreInfo", this.moreInfo);	
	}
    
    getFunctionData(functionName:string, params?){
		if(typeof(params)== 'undefined'){
			params= []
		}
		return this._contract.getFunctionData(this.contract,functionName, params)
    }

    checkERC20(){
		let hasName = false;
		let hasSymbol = false;
		let hasDecimals = false;
		let hasTotalsupply = false;
		let hasBalanceOf = false;
		let abi =  this.contract.abi;

		console.log(this.contract.address)
		let isErc20 = true;
		if(abi.find(x=> x.name ="name") == null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name ="symbol") == null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name ="decimals") == null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name ="totalSupply") == null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name ="balanceOf") == null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name =="approve")== null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name =="allowance")== null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name =="transfer")== null){
			isErc20 = false;
		}
		if(abi.find(x=> x.name =="transferFrom")== null){
			isErc20 = false;
		}
		 return isErc20;
	}

    async getContractData(): Promise<any[]>{
		let info =[];
		let functions = this.contract.abi.filter(data=>{
			return data['constant']==true && data['inputs'].length==0
		});
			
		for(let i = 0; i<functions.length; i++) {
			let result;
			try {
				result = await this._contract.callFunction(this.contract, functions[i].name,[]);	
			} catch (error) {
				console.log(error);
			}
			
			info.push([functions[i].name,result]);
			console.log("info?",info);
			
		}
		return info;
	}

	getFunctions(): void {
		let txFunctions = this. getTransFunctions();
		let infoFunctions = this.getInfoFunctions();
		let functions = txFunctions.concat(infoFunctions);
		
		this.functions = functions;
		console.log("this.functions", this.functions);
		
	}

	getTransFunctions(): any[]{
		let functions = this.contract.abi.filter(data => data.constant == false);
		return functions
	}
	
	getInfoFunctions(): any[]{
		let functions = this.contract.abi.filter(data => data['constant']==true && data['inputs'].length>0);
		return functions
	}

		
}