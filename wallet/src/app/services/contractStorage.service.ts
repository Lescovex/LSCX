import { Injectable} from '@angular/core';
import { Web3 } from './web3.service';
import { AccountService } from './account.service';

@Injectable()
export class ContractStorageService {
    contracts: Array<any>;
    accContracts: Array<any>;

    constructor(private _web3: Web3, private _account: AccountService){
        this.setContracts();
        this.setAccContracts();
        //console.log("CONTRACTS", this.contracts, this.accContracts)
    }

    setContracts(){
        if(localStorage.getItem('contracts')){
            this.contracts= JSON.parse(localStorage.getItem('contracts'));
        }else{
            this.contracts = [];
        }
    }

    setAccContracts(){
        this.accContracts = this.contracts.filter(contract=> contract.account == this._account.account.address && contract.network == this._web3.network);
    }

    removeAccContracts(address){
        let contracts = this.contracts.filter(contract=> contract.account != address);
        console.log("filtrado",contracts)
        if(contracts == []) {
            localStorage.removeItem('contracts');
        } else {
            localStorage.setItem('contracts', JSON.stringify(contracts));
        }
    }

    addContract(contract){
            this.contracts.push(contract);
            //console.log("Add",this.contracts)
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
                    pending.push(index)
                }
            })
            //console.log("pending",pending)
            if(pending.length==0){
                clearInterval(checkInterval)
            }
            for(let i=0; i<pending.length; i++){
                let contractAddr = await this._web3.getTxContractAddress(this.contracts[pending[i]].deployHash);
                //console.log("cAddr",contractAddr)
                if(contractAddr!= null){
                    this.contracts[pending[i]].address = contractAddr
                    this.contracts[pending[i]].active = true;
                }
                //console.log(this.contracts);
                this.saveContracts();
            }

        },3000);
        
    }

    saveContracts(){
        localStorage.setItem('contracts',JSON.stringify(this.contracts))
    }

    activeContract(contract){}

}