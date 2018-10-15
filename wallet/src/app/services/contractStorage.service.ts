import { Injectable} from '@angular/core';
import { Web3 } from './web3.service';
import { AccountService } from './account.service';

@Injectable()
export class ContractStorageService {
    contracts: Array<any>;
    LSCX_Contracts: Array<any>;
    customContracts: Array<any>;

    constructor(private _web3: Web3, private _account: AccountService){
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
                    this.contracts[pending[i]].address = contractAddr
                    this.contracts[pending[i]].active = true;
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