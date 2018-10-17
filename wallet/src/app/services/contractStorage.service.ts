import { Injectable} from '@angular/core';
import { Web3 } from './web3.service';
import { AccountService } from './account.service';
import { EtherscanService } from './etherscan.service';
import { Http, Headers, RequestOptions } from "@angular/http";
var fs = require('fs');

@Injectable()
export class ContractStorageService {
    contracts: Array<any>;
    LSCX_Contracts: Array<any>;
    customContracts: Array<any>;

    constructor(private _web3: Web3, private _account: AccountService, protected _scan : EtherscanService, protected http : Http){
        this.setContracts();
        this.setAccContracts();
    }

    setContracts(){
        if(localStorage.getItem('contracts')){
            this.contracts= JSON.parse(localStorage.getItem('contracts'));
        }else{
            this.contracts = [];
        }
    }

    setAccContracts(){
        this.LSCX_Contracts = this.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network && contract.type != "custom");
        this.customContracts = this.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network && contract.type == "custom");
    }

    deletContract(contract){
        
        this.contracts= this.contracts.filter(c=> JSON.stringify(c) !=JSON.stringify(contract));
        this.saveContracts();
        this.setAccContracts();
    }

    removeAccContracts(address){
        this.contracts = this.contracts.filter(contract=> contract.account != address);
        this.saveContracts();
    }

    addContract(contract){
            this.contracts.push(contract);
            this.saveContracts();
            this.setAccContracts();
    }
    
    isDuplicated(address, account){
        let result = this.contracts.findIndex(contract=> contract.address == address && contract.account == account);
        if(result !=-1){
            return true
        }else{
            return false
        }

    }
    async checkForAddress(){
        let checkInterval= setInterval(async()=>{
            let pending = [];
            this.contracts.forEach((contract, index)=> {
                if(contract.active==false){
                    pending.push(index);        

                }
            })    
            if(pending.length==0){
                clearInterval(checkInterval)
            }
            for(let i=0; i<pending.length; i++){
                let contractAddr = await this._web3.getTxContractAddress(this.contracts[pending[i]].deployHash);                
                if(contractAddr!= null){                    
                    this.contracts[pending[i]].address = contractAddr;
                    this.contracts[pending[i]].active = true;

                    let info = JSON.parse(localStorage.getItem("deployInfo"));
                    
                    let _compilerversion;
                    let _contractName;
                    let _sourceCode:string;

                    if(info.contract == "LSCX_ABT"){
                        _compilerversion = "v0.4.19+commit.c4cbbb05"
                        _contractName = "Lescovex_ABT";
                    }
                    if(info.contract == "LSCX_CIF"){
                        _compilerversion = "v0.4.19+commit.c4cbbb05"
                        _contractName = "Lescovex_CIF";
                    }
                    if(info.contract == "LSCX_CYC"){
                        _compilerversion = "v0.4.24+commit.e67f0147"
                        _contractName = "Lescovex_CYC";
                    }
                    if(info.contract == "LSCX_ISC"){
                        _compilerversion = "v0.4.24+commit.e67f0147";
                        _contractName = "Lescovex_ISC";
                    }
                    
                    let self = this;
                    
                    await fs.readFile("./src/LSCX-contracts/"+info.contract+".sol", function(err, data) {
                        if (err) {
                            return console.log(err);
                        }
                        if (data) {
                            var x = data.toString();
                            _sourceCode = x;

                            self._scan.setUrlStarts();
                            let net = self._scan.urlStarts.replace("-", "");
                            if(net!=""){
                                net = net+".";
                            }
                            let url = "https://"+net+"etherscan.io/address/"+contractAddr;

                            let headers = new Headers();
                            headers.append('Content-Type', 'text/html');
                            //console.log("start pause");
                            setTimeout(function(){
                                //do what you need here
                                //console.log("paused 30 seconds");
                                
                                self.http.get(url,  {headers: headers}).subscribe((res:any) =>{
                                    //console.log("response", res)
                                    let x = res._body;
                                    //console.log("responsebody", x);
                                    
                                    let len = x.length                        
                                    let y = x.split("pre")[4];
                                    //console.log("primersplit",y);
                                    
                                    let z = y.split(">")[1];
                                    //console.log("segundosplit",z)
                                    let a =z.split("<")[0];
                                    //console.log("tercersplit",a);
                                    
                                    let _constructorArguments = a;
                                    //console.log(_constructorArguments);
                                    
                                    self._scan.setVerified(contractAddr, _sourceCode, _contractName, _compilerversion, _constructorArguments)
    
                                }, err =>{
                                    console.log(err);
                                    
                                });
                            }, 120000);
                            
                            
                        }
                    });
                    
                
                }
                this.saveContracts();
            }

        },3000);
        
    }

    saveContracts(){
        if(this.contracts == []) {
            localStorage.removeItem('contracts');
        } else {
            localStorage.setItem('contracts', JSON.stringify(this.contracts));
        }
    }

    activeContract(contract){}

}