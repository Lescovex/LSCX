import { Injectable} from "@angular/core";
import { Http, Headers, RequestOptions } from "@angular/http";
import "rxjs/add/operator/map";

import { Web3 } from "./web3.service"
const shell = require('electron').shell;


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
		this.setUrlStarts();
		console.log(this.urlStarts);
    	let url = "https://api"+this.urlStarts+".etherscan.io/api?module=account&action=tokentx&address="+addr+"&startblock=0&endblock=99999999&sort=asc&apikey="+this.apikey;
   
    	return this.http.get(url).map(res => res.json());
	}
	
	getAbi(contractAddr){
		this.setUrlStarts();
		let url = "https://api"+this.urlStarts+".etherscan.io/api?module=contract&action=getabi&address="+contractAddr+"&apikey="+this.apikey;
		return this.http.get(url).map(res => res.json()).toPromise();
	}

	openTokenUrl(txHash, address){
		let net = this.urlStarts.replace("-", "");
		if(net!=""){
			net = net+".";
		}
    	shell.openExternal('https://'+net+'etherscan.io/token/'+txHash+'?a='+address);
	}
	
	async setVerified(_contractAddr, _sourceCode, _contractName, _compilerversion, _constructorArguments){
		this.setUrlStarts();
		
		let x = encodeURIComponent(_sourceCode).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\!/g,"%21").replace(/\'/g,"%27");
		console.log(x);
		
		let url = "https://api"+this.urlStarts+".etherscan.io/api";
	
		console.log("addr",_contractAddr);
		console.log("name",_contractName);
		console.log("version",_compilerversion);
		console.log("arguments",_constructorArguments);
		
		const formData = new FormData();
		
		// append your data
		formData.append('apikey',this.apikey);
		formData.append('module', 'contract');
		formData.append('action', 'verifysourcecode');
		formData.append('contractaddress', _contractAddr);
		formData.append('contractname', _contractName);
		formData.append('compilerVersion', _compilerversion);
		formData.append('optimizationUsed', '1');
		formData.append('runs', '200');
		formData.append('constructorArguements', _constructorArguments);
		formData.append('sourceCode', x);
		
		this.http.post(url,formData).subscribe(async res =>{
            console.log("res post form?",res);
            
        }, err =>{
            console.log(err);
           
		});
	}

	
}