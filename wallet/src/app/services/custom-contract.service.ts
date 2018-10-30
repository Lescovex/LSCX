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
		this.contractInfo = {address :contract.address, name: contract.name};
		
		this.moreInfo= await this.getContractData(); 
		let history = await this._scan.getHistory(contract.address);
		for(let i =0; i<history.length; i++){
			let date = this._scan.tm(history[i].timeStamp);
			history[i].date = date;
		}
		this.contractHist = history;
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
		/*for(let i = 0; i<abi.length; i++) {
			if('constant' in abi[i] && abi[i].constant){
				if(abi[i].name ="name" && abi[i].outputs[0].type=="string"){
					hasName = true;
				}
				if(abi[i].name ="symbol" && abi[i].outputs[0].type=="string"){
					hasSymbol = true;
				}
				if(abi[i].name ="decimals" && abi[i].outputs[0].type=="uint8"){
					hasDecimals = true;
				}
				if(abi[i].name ="totalSupply" && abi[i].outputs[0].type=="uint256"){
					hasTotalsupply = true;
				}
				if(abi[i].name ="balanceOf" && abi[i].outputs[0].type=="uint256"){
					hasBalanceOf = true;
				}
			}
		}*/
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
		//falta Mirar allowance, transfer, transferFrom, approve
		 //return hasName && hasSymbol && hasSymbol && hasDecimals && hasTotalsupply && hasBalanceOf;
		 return isErc20;
	}

    async getContractData(): Promise<any[]>{
		let info =[];
		let functions = this.contract.abi.filter(data=>{
			return data['constant']==true && data['inputs'].length==0
		});
			
		for(let i = 0; i<functions.length; i++) {
			let result = await this._contract.callFunction(this.contract, functions[i].name,[]);
			info.push([functions[i].name,result]);
		}
		return info;
	}

	getFunctions(): void {
		let txFunctions = this. getTransFunctions();
		let infoFunctions = this.getInfoFunctions();
		let functions = txFunctions.concat(infoFunctions);
	
		this.functions = functions
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