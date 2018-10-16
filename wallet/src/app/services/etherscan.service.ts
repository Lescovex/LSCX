import { Injectable} from "@angular/core";
import { Http, Headers, RequestOptions } from "@angular/http";
import "rxjs/add/operator/map";

import { Web3 } from "./web3.service"
<<<<<<< HEAD
import { resolve } from "path";
=======
const shell = require('electron').shell;
>>>>>>> a185a7f2184fc81eff888b853bac65a65d46f75b


@Injectable()
export class EtherscanService {
	apikey = "";
	urlStarts = "";
	constructor(private _web3 : Web3, private http: Http){	
		this.getApiKey();
	}
	setApiKey(apikey){
		this.apikey = apikey;
		let apikeys: any= {};
		if(localStorage.getItem("apikeys")){
		  apikeys = JSON.parse(localStorage.getItem("apikeys"));
		}
		  apikeys.eth = apikey;
		  localStorage.setItem("apikeys",JSON.stringify(apikeys));
	
	}
	getApiKey(){
		if(localStorage.getItem("apikeys")){
		  let apikeys : any = JSON.parse(localStorage.getItem("apikeys"));
		  if("eth" in apikeys){
			this.apikey  = apikeys.eth;
		  }
		}
	}
	setUrlStarts(){
		this.urlStarts = (this._web3.network.chain == 1)? "": "-"+this._web3.network.urlStarts;
	}

	getTx(address:string){
		this.setUrlStarts();
		let url = "https://api"+this.urlStarts+".etherscan.io/api?module=account&action=txlist&address="+address+"&startblock=0&endblock=99999999&sort=asc&apikey="+this.apikey;
		return this.http.get(url).map(res => res.json());
	}
	
	getInternalTx(address:string){
		this.setUrlStarts();
		let url = "https://api"+this.urlStarts+".etherscan.io/api?module=account&action=txlistinternal&address="+address+"&startblock=0&endblock=99999999&sort=asc&apikey="+this.apikey;
		return this.http.get(url).map(res => res.json());
	}

	async getHistory(address:string){
		let historyResp = await this.getTx(address).toPromise();
		let internalResp = await this.getInternalTx(address).toPromise()
		
		let history = historyResp.result;
		let intHistory  = internalResp.result;
		for(let i =0; i<intHistory.length; i++){
			history.push(intHistory[i]);
		}
		
		history.sort((a,b)=>{
			return a.timeStamp - b.timeStamp
		});
		history = history.reverse();
		
		return history;
	}

	tm(unix_tm) {
    let dt = new Date(parseInt(unix_tm)*1000); // Devuelve más 2 horas
    let  strDate = dt.getUTCDate()+"-"+(dt.getUTCMonth()+1)+"-"+dt.getUTCFullYear();
    return strDate;
	}

	getTokensTransfers(addr){
<<<<<<< HEAD
		let network = (this._web3.network == 1)? "": "-ropsten"
    	let url = "https://api"+network+".etherscan.io/api?module=account&action=tokentx&address="+addr+"&startblock=0&endblock=99999999&sort=asc&apikey="+this.apikey;
=======
		this.setUrlStarts();
		console.log(this.urlStarts);
    	let url = "https://api"+this.urlStarts+".etherscan.io/api?module=account&action=tokentx&address="+addr+"&startblock=0&endblock=99999999&sort=asc&apikey="+this.apikey;
>>>>>>> a185a7f2184fc81eff888b853bac65a65d46f75b
   
    	return this.http.get(url).map(res => res.json());
	}
	
	getAbi(contractAddr){
		this.setUrlStarts();
		let url = "https://api"+this.urlStarts+".etherscan.io/api?module=contract&action=getabi&address="+contractAddr+"&apikey="+this.apikey;
		return this.http.get(url).map(res => res.json()).toPromise();
	}

<<<<<<< HEAD
	getConstructorArgs(contractAddr){
		let network = (this._web3.network == 1)? "": "-ropsten";
		let url = "https://"+network+"etherscan.io/address/"+contractAddr;
		let headers = new Headers();
		headers.append('Content-Type', 'text/html');
		this.http.get(url,  {headers: headers}).subscribe((res:any) =>{
			
			let x = res._body;
			let len = x.length;
			console.log(len);
			
			let y = x.split("pre")[4];
			console.log("cutted",y);
			y = y.split(">")[1];
			console.log("second cut", y);
			y = y.split("<")[0];
			console.log("third cut", y);
			return y;
		   }, err =>{
			 console.log(err);
			
		   });
	
	}

	async setVerified(_contractAddr, _sourceCode, _contractName, _compilerversion, _constructorArguments){
		let network = (this._web3.network == 1)? "": "-ropsten";
		//let x = encodeURIComponent(_sourceCode)
		let x = encodeURIComponent(_sourceCode).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\!/g,"%21").replace(/\'/g,"%27");
		console.log(x);
		
		let url = "https://api"+network+".etherscan.io/api";
		//?apikey="+this.apikey+"&
		//module=contract&
		//action=verifysourcecode&
		//contractaddress="+ _contractAddr +"&
		//contractname="+_contractName+"&
		//compilerversion="+_compilerversion + "&
		//optimizationUsed=1&
		//runs=200&
		//constructorArguements="+_constructorArguments + "&
		//sourceCode="+x;

		//"https://api"+network+".etherscan.io/api?action=verifysourcecode&contractaddress="+ _contractAddr +"&contractname="+_contractName+"&compilerversion="+_compilerversion + "&optimizationUsed=1&runs=200&constructorArguements"+_constructorArguments + "&sourceCode="+_sourceCode;
		console.log("addr",_contractAddr);
		console.log("name",_contractName);
		console.log("version",_compilerversion);
		console.log("arguments",_constructorArguments);
		
		let params = new URLSearchParams;
			params.append('apikey', this.apikey);
			params.append('module', 'contract');
			params.append('action', 'verifysourcecode');
			params.append('contractaddress', _contractAddr);
			params.append('contractname', _contractName);
			params.append('commpilerversion', _compilerversion);
			params.append('optimizationUsed', "1");
			params.append('runs', "200");
			params.append('constructorArguements', _constructorArguments);
			params.append('sourceCode', x);

		/*
		let data = {
			apikey : this.apikey,
			module : "contract",
			action : "verifysourcecode",
			contractaddress : _contractAddr,
			contractname : _contractName,
			compilerversion : _compilerversion,
			optimizationUsed : 1,
			runs : 200,
			constructorArguements: _constructorArguments,
			sourceCode : x
		}
		*/
		//let info = JSON.stringify(data)
		let headers = new Headers();
		//application/json, text/plain, */*
		headers.append('Content-Type', 'application/json; charset=UTF-8');
		
		this.http.post(url, params, {headers: headers}).subscribe(async res =>{
            console.log("res post form?",res);
            
        }, err =>{
            console.log(err);
           
		});
		/*
		 apikey: $('#apikey').val(),                     //A valid API-Key is required        
        module: 'contract',                             //Do not change
        action: 'verifysourcecode',                     //Do not change
        contractaddress: $('#contractaddress').val(),   //Contract Address starts with 0x...     
        sourceCode: $('#sourceCode').val(),             //Contract Source Code (Flattened if necessary)
        contractname: $('#contractname').val(),         //ContractName
        compilerversion: $('#compilerversion').val(),   // see http://etherscan.io/solcversions for list of support versions
        optimizationUsed: $('#optimizationUsed').val(), //0 = Optimization used, 1 = No Optimization
        runs: 200,                                      //set to 200 as default unless otherwise         
        constructorArguements: $('#constructorArguements').val(),   //if applicable
		*/
	}

	/*
	100, "ABT Contract", "ABT", "0xa071eccba337241e412957793e915bb70583440c", 20

	//Submit Source Code for Verification
		success: function (result) {
			console.log(result);
			if (result.status == "1") {
				//1 = submission success, use the guid returned (result.result) to check the status of your submission.
				// Average time of processing is 30-60 seconds
				document.getElementById("postresult").innerHTML = result.status + ";" + result.message + ";" + result.result;
				// result.result is the GUID receipt for the submission, you can use this guid for checking the verification status
			} else {
				//0 = error
				document.getElementById("postresult").innerHTML = result.status + ";" + result.message + ";" + result.result;
			}
			console.log("status : " + result.status);
			console.log("result : " + result.result);
		},
		error: function (result) {
			console.log("error!");
			document.getElementById("postresult").innerHTML = "Unexpected Error"
		}
	});
	*/
=======
	openTokenUrl(txHash, address){
		let net = this.urlStarts.replace("-", "");
		if(net!=""){
			net = net+".";
		}
    	shell.openExternal('https://'+net+'etherscan.io/token/'+txHash+'?a='+address);
	}
	

>>>>>>> a185a7f2184fc81eff888b853bac65a65d46f75b

	
}