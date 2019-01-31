import { Component, OnInit, DoCheck }  from '@angular/core'

import { Web3 } from '../../services/web3.service';
import { AccountService } from '../../services/account.service';
import { DialogService } from '../../services/dialog.service';

import { ContractStorageService } from '../../services/contractStorage.service';
import { LSCXContractService } from '../../services/LSCX-contract.service';
import { CustomContractService } from '../../services/custom-contract.service';
import { LSCXMarketService } from '../../services/LSCX-market.service';
import { ZeroExService } from "../../services/0x.service";

@Component({
    selector: 'app-network',
    templateUrl: './network.component.html',
})
export class NetWorkComponent implements OnInit, DoCheck{
    NETWORKS: any[] = [{chain:1, name: "Main Ethereum Network", urlStarts:"mainnet"}, {chain:3, name: "Ropsten Test Network", urlStarts:"ropsten"}, {chain:42, name: "Kovan Test Network", urlStarts:"kovan"}]
    net: any;
    show: boolean = false;
    loading: boolean =  false;
    dialog;
    constructor(private _zeroEx: ZeroExService,private _LSCXmarket: LSCXMarketService, private _web3: Web3, private _account: AccountService, private _dialog: DialogService, private _LSCXcontract: LSCXContractService, private _customContract: CustomContractService, private _contractStorage: ContractStorageService) {

    }
    ngOnInit(){
        switch (this._web3.network.chain) {
            case 1: 
                this.net = this.NETWORKS[0];
                break;
            case 3:
                this.net = this.NETWORKS[1];
                break;
            case 42:
                this.net = this.NETWORKS[2];
                break;

        }
    }

    ngDoCheck(){
        if(this._account.updated == true && this.loading){
            this.loading = false;
            this.dialog.close();
            this.show = !this.show;
        }
    }

    toggleShow(){
        this.show = !this.show;
    }

    async selectNetwork(network: any){
        if(this.net.chain == network.chain ){
            this.show = !this.show;
            return false
        }
        this._zeroEx.loaded = null;
        this._account.updated = false;
        this.loading = true;
        this.dialog = this._dialog.openLoadingDialog();
        this.net = network;
        
        await this._web3.setNetwork(network);
        this._zeroEx.init();
        this._LSCXmarket.showBuys = null;
        this._LSCXmarket.showSells = null;
        this._LSCXmarket.setMarket();
        
        if('address' in this._account.account){
            this._contractStorage.setAccContracts();
            
            //this._LSCXmarket.resetSocket();
            this._LSCXcontract.reset();
            this._customContract.reset();
            await this._account.refreshAccountData();
        }else{
            this.dialog.close();
            this.show = !this.show;
        }
        
    }
}
