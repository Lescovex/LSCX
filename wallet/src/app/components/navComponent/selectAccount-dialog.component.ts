import { Component, OnInit} from '@angular/core'
import { Router } from '@angular/router';
/*Dialog*/
import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

/*Services*/
import { AccountService } from '../../services/account.service';
import { WalletService } from '../../services/wallet.service';
import { LSCXContractService } from '../../services/LSCX-contract.service';
import { ContractStorageService } from '../../services/contractStorage.service';
import { CustomContractService } from '../../services/custom-contract.service';
import { ZeroExService } from "../../services/0x.service";

@Component({
  selector: 'selectAccount-dialog',
  templateUrl: './selectAccount-dialog.component.html',
  styleUrls: ['./selectAccount.css']
})
export class SelectAccountDialogComponent implements OnInit{

  selectedAcc;
  selectedBTCAcc;
  filts;
  constructor(public _zeroEx: ZeroExService,private router: Router, public dialog: MdDialog, public dialogRef: MdDialogRef<SelectAccountDialogComponent>, public _account: AccountService, private _contracStorage: ContractStorageService, private _wallet: WalletService, private _LSCXcontract: LSCXContractService,private _customContract: CustomContractService) {

  }
  ngOnInit(){
    this.selectedAcc = this._account.account;

    this.filts = "Ethereum"
  }

  changeSelected(account){
    this.selectedAcc = account;
  }
  changeBTCSelected(account){
    this.selectedBTCAcc = account;
  }
  selectAccount(){
    if(this._account.account.address != this.selectedAcc.address){
      this._zeroEx.loaded = null;
      this._account.updated = false;
      this._account.setAccount(this.selectedAcc);
      this._contracStorage.setAccContracts();
      this._zeroEx.init();
      this._LSCXcontract.reset();
      this._customContract.reset();
      this.dialogRef.close('loading');
    }else{
      this.dialogRef.close();
    }
  }
  async selectBTCAccount(){
    /*
    this.dialogRef.close('loading');
    if(this._btcAccount.account.address != this.selectedBTCAcc.address){
      this._btcAccount.account.history = null;
      this._btcAccount.setAccount(this.selectedBTCAcc);
      this.dialogRef.afterClosed().subscribe(async result=>{
        this.router.navigate(['/btcwallet/btcglobal']);
      });
    }else{
      this.dialogRef.close();
    }*/
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
