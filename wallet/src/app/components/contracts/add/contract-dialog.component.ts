import { Component,  Inject, OnInit} from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import { AddContractPage } from './add-contract.component';


@Component({
    selector: 'contract-dialog',
    templateUrl: './contract-dialog.component.html'
})

export class ContractDialogComponent implements OnInit{
    public title;
    public img;
    public usages;
    public description;
    
    

    constructor(@Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<ContractDialogComponent>){

    }
    ngOnInit(){
        if(this.data.title == "LSCX_ABT"){
            this.title = 'Asset-Backed Tokens (ABT)';
            this.img = '~icons/LSCX_ABT.svg';
            this.usages = ['Commodities', 'Financial assets'];
            this.description = "ABTs represent digital ownership with respect to an underlying tangible, intangible or financial asset. Lescovex only considers for listing ABTs whose underlying assets are highly fungible, such as commodities and securities. To decide which asset class an ABT represents to we look at its underlying asset. If an ABT is “backed” by a commodity, we will consider it a commodity. Likewise, if an underlying is a security the ABT will undoubtedly be a financial asset.";
        }
        if(this.data.title == "LSCX_CYC"){
            this.title = 'Crypto Currencies (CYC)';
            this.img = '~icons/LSCX_CYC.svg';
            this.usages = ['Payment Token', 'Utility Token'];
            this.description = "Crypto currencies can be used as a store of value and medium of exchange as well as provide some functionalities such as access to web applications and other services. We contemplate crypto currencies as commodities. They are highly fungible and have no intrinsic value, so their value is driven by their utility and scarcity rather than a stream of cash flows.";
        }
        if(this.data.title == "LSCX_ISC"){
            this.title = 'Income Smart Contract (ISC)';
            this.img = '~icons/LSCX_ISC.svg';
            this.usages = ['Equity Token', 'Debt Token'];
            this.description = "ISCs allow issuers the distribution of income by setting fixed or variable payments in Ether to token holders. Capital distributions are automatically executed provided some predefined contract specifications are met. Income Smart Contracts are classified as financial assets and may be analogous to conventional equity and debt instruments.";
        }
        if(this.data.title == "LSCX_CIF"){
            this.title = 'Crypto Investment Fund (CIF)';
            this.img = '~icons/LSCX_CIF.svg';
            this.usages = ['Closed-end', 'Open-end'];
            this.description = "CIFs may take the form of closed-end or open-end and whose underlying investments comprise digital assets of any kind. Smart contracts unleash efficiency improvements for investment funds operations, including fast and auditable capital calls and distributions alongside transparent, error-proof, Net Asset Value (NAV) calculations. We label crypto investment funds as securities.";
        }        
    }
    closeDialog(){
        this.dialogRef.close();
    }

}