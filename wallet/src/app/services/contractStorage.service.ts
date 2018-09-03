import { Injectable} from '@angular/core';
import { Web3 } from './web3.service';

@Injectable()
export class ContractStorageService {
    contracts: Array<any>;
    constructor(private _web3: Web3){
        this.getContracts();
        console.log("CONTRACTS", this.contracts)
    }

    getContracts(){
        if(localStorage.getItem('contracts')){
            this.contracts = JSON.parse(localStorage.getItem('contracts'));
        }else{
            this.contracts = [];
        }
    }

    addContract(contract){
            this.contracts.push(contract);
            console.log("Add",this.contracts)
            this.saveContracts();
 
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
                    pending.push(index)
                }
            })
            console.log("pending",pending)
            if(pending.length==0){
                clearInterval(checkInterval)
            }
            for(let i=0; i<pending.length; i++){
                let contractAddr = await this._web3.getTxContractAddress(this.contracts[pending[i]].deployHash);
                console.log("cAddr",contractAddr)
                if(contractAddr!= null){
                    this.contracts[pending[i]].address = contractAddr
                    this.contracts[pending[i]].active = true;
                }
                console.log(this.contracts);
                this.saveContracts();
            }

        },3000);
        
    }

    saveContracts(){
        localStorage.setItem('contracts',JSON.stringify(this.contracts))
    }

    activeContract(contract){}

}