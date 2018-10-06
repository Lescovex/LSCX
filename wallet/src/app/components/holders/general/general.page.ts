import { Component, OnInit, OnDestroy, DoCheck, Injectable } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';
import { MdDialog } from '@angular/material';
import { WalletService } from "../../../services/wallet.service";

import * as EthTx from 'ethereumjs-tx';
import * as EthUtil from 'ethereumjs-util'

import { Router } from '@angular/router';

//dialogs
import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';

@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class HoldersGeneralPage implements OnInit {
  
  protected LSCX_Addr;
  protected LSCX_Abi;
  protected LSCX_Contract;

  public loadingD;

  protected balance;
  protected holdedOf;
  protected expected;

  constructor(protected _account: AccountService, private _token: TokenService, private _web3: Web3, private _dialog: DialogService, public dialog: MdDialog, private  _rawTx:RawTxService, private sendDialogService: SendDialogService) {
    Promise.resolve().then(() => { 
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    });
    
  }

  ngOnInit() {
      this.setContract()
  }

  async setContract(){
    this.getAbi();
    if(this._web3.network == 3){
      this.LSCX_Addr = "0xB2F524a6825F8986Ea6eE1e6908738CFF13c5B31";
      
    }
    if(this._web3.network == 1  ){
      this.LSCX_Addr = "0x5bf5f85480848eB92AF31E610Cd65902bcF22648";
      
    }
    if(this._web3.infuraKey != ''){
      this.LSCX_Contract = this._web3.web3.eth.contract(this.LSCX_Abi).at(this.LSCX_Addr);
      
    }
    await this.load();
  }
  getAbi(){
    this.LSCX_Abi = require('../../../../assets/abi/LSCX_Holders.json');
  }

  async load(){
    let amount = await this.getUserBalance();
    let decimals = 8;
    this.balance = amount / Math.pow(10,decimals);
    
    let holded = await this.getHoldedOf();
    this.holdedOf = holded / Math.pow(10, decimals);

    let contractBalance = await this.getContractBalance();

    let totalSupply = await this.getTotalSupply();
    
    this.expected =  (holded * contractBalance)/totalSupply;;

    this.loadingD.close();


  }

  getUserBalance(): Promise<number>{
    let self=this;  
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.balanceOf.call(self._account.account.address, function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
        }
      });
    });
  }

  getHoldedOf(): Promise<number>{
    let self=this;
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.holdedOf.call(self._account.account.address,function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
        }
      });
    });
  }

  getContractBalance(): Promise<number>{
    let self=this;
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.contractBalance.call(function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
        }
      });
    });
  }
  
  getTotalSupply(): Promise<number>{
    let self=this;   
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.totalSupply.call(function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
        }
      });
    });
  }

  async withdraw(){
    this.loadingD = this.dialog.open(LoadingDialogComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });

    let withdrawData = await this.withdrawReward();
    let gasPrice = 10000000000;
    let gasLimit;

    try{
      gasLimit = await this._web3.estimateGas(this._account.account.address, this.LSCX_Addr, "", parseInt(this.expected));
    }catch(e){
      gasLimit = 1000000;
    }

    this.loadingD.close();
    let dialogRef = this._dialog.openGasDialog(gasLimit, gasPrice);
    let result = await dialogRef.afterClosed().toPromise();
    
    let options:any = null;
    if(typeof(result) != 'undefined'){
        options = JSON.parse(result);
        options.data =  withdrawData;
    }
    if(options!=null){
      let tx =  await this._rawTx.createRaw(this.LSCX_Addr, 0 , options)
      let amount = 0;
      let cost = tx[1];
    
      this.sendDialogService.openConfirmSend(tx[0], this.LSCX_Addr, 0, tx[1], tx[1],'withdraw');
    }
    
  }

  withdrawReward():string{
    let txData = this.LSCX_Contract.withdrawReward.getData();
    return txData
  }

  async unsignedTx(contractAddr,txData, gLimit, gprice, amount?){
    let gasLimit = gLimit;
    
    
    let chainId;
    if(this._web3.network == 1){
      chainId = "0x1";
    }
    if(this._web3.network == 3){
      chainId = "0x3";
    }
    
    let acc = this._account.account;
    
    let amountW = (typeof(amount) == "undefined")? 0 : amount;
    let gasPrice  = gprice;
    let nonce = await this._web3.getNonce(acc.address);

    let txParams = {
      nonce: nonce,
      gasPrice: this._web3.web3.toHex(gasPrice),
      gasLimit: this._web3.web3.toHex(gasLimit),
      to: contractAddr,
      value: this._web3.web3.toHex(amountW),
      data: txData,
      chainId: chainId
    }
  
    let tx= new EthTx(txParams);
    
    let fees = gasLimit*gasPrice;
    let cost = 0;
    if(typeof(amount) == "undefined"){
      cost = fees
    }else{
      cost = fees+parseFloat(amount);
    }

    return [tx, fees, cost, EthUtil.bufferToHex(tx.hash(true))]

  }
  serializeTx(tx,pass){
    let tx2= tx;
    let privateKey;
    try{
      privateKey = this._account.getPrivateKey(pass)
    }catch(e){
      return false;
    }
    tx2.sign(privateKey);
    let serialized = EthUtil.bufferToHex(tx2.serialize());
    return serialized;
  }
}