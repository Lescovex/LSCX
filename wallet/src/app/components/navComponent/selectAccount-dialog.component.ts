import { Component, OnInit} from '@angular/core'

/*Dialog*/
import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

/*Services*/
import { AccountService } from '../../services/account.service'
import { WalletService } from '../../services/wallet.service'
import { LSCXContractService } from '../../services/LSCX-contract.service';
import { MarketService } from '../../services/market.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { CustomContractService } from '../../services/custom-contract.service';


@Component({
  selector: 'selectAccount-dialog',
  templateUrl: './selectAccount-dialog.component.html',
  styleUrls: ['./selectAccount.css']
})
export class SelectAccountDialogComponent implements OnInit{

  selectedAcc;

  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<SelectAccountDialogComponent>, public _account: AccountService, private _contracStorage: ContractStorageService, private _wallet: WalletService, private _LSCXcontract: LSCXContractService,private _customContract: CustomContractService, private _market: MarketService) {
    
  }
  ngOnInit(){
    this.selectedAcc = this._account.account;
  }

  changeSelected(account){
    this.selectedAcc=account;    
  }

  selectAccount(){
    if(this._account.account.address != this.selectedAcc.address){
      this._account.updated = false;
      this._account.setAccount(this.selectedAcc);
      this._contracStorage.setAccContracts();
      this._LSCXcontract.reset();
      this._customContract.reset();
      if(typeof(this._market.socket)!= "undefined"){
        this._market.resetSocket();
      }
      this.dialogRef.close('loading');
    }else{
      this.dialogRef.close();
    } 
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
