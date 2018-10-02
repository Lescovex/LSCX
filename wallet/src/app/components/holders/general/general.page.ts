import { Component, OnInit, OnDestroy, DoCheck, Injectable } from '@angular/core'

/*Services*/
import { AccountService } from '../../../services/account.service'
import { TokenService } from '../../../services/token.service';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';
import { MdDialog } from '@angular/material';
import { WalletService } from "../../../services/wallet.service";
import { WithdrawDialog } from './withdraw-dialog.component';
import { WithdrawTxDialog } from './withdrawTx.component';
import * as EthTx from 'ethereumjs-tx';
import * as EthUtil from 'ethereumjs-util'

import { Router } from '@angular/router';

//dialogs
import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';

@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class HoldersGeneralPage implements OnInit, OnDestroy, DoCheck {
  
  protected LSCX_Addr;
  protected LSCX_Abi;
  protected LSCX_Contract;

  public loadingD;

  protected balance;
  protected holdedOf;
  protected expected;

  constructor(protected _account: AccountService, private _token: TokenService, private _web3: Web3, private _dialog: DialogService, public dialog: MdDialog, private router : Router) {
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
    

  ngOnDestroy(){
    
  }

  ngDoCheck() {
   
  }
  async setContract(){
    this.getAbi();
    if(this._web3.network == 3){
      this.LSCX_Addr = "0xB2F524a6825F8986Ea6eE1e6908738CFF13c5B31";
      
      console.log("Testnet Contract");
      
    }
    if(this._web3.network == 1  ){
      this.LSCX_Addr = "0xdC33d6c4997Ed9c6f07644ECA9C0ba72a6882052";
      
      console.log("Mainnet Contract");
      
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
    let decimals = await this.getDecimals();
    this.balance = amount / Math.pow(10,decimals);
    
    let holded = await this.getHoldedOf();
    this.holdedOf = holded / Math.pow(10, decimals);

    let contractBalance = await this.getContractBalance();
    console.log("contractBalance", contractBalance);

    let totalSupply = await this.getTotalSupply();
    console.log("totalsupply",totalSupply);
    
    console.log("expectedWithdraw", (holded * contractBalance)/totalSupply);
    this.expected = (holded * contractBalance)/totalSupply;

    this.loadingD.close();
    //2592000 equal to 30 days

  }

  getUserBalance(): Promise<number>{
    let self=this;  
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.balanceOf.call(self._account.account.address, function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
          console.log("res?",res);
          
        }
      });
    });
  }
  getDecimals(): Promise<number>{
    let self=this;
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.decimals.call(function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
          console.log("res?",res);
          
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
          console.log("res?",res);
          
        }
      });
    });
  }
  getContractBalance(): Promise<number>{
    let self=this;
    console.log("contractBalance?");
    
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.contractBalance.call(function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
          console.log("res?",res);
          
        }
      });
    });
  }
  getTotalSupply(): Promise<number>{
    let self=this;
    console.log("entras aqui?");
    
    return new Promise (function (resolve, reject) {
      self.LSCX_Contract.totalSupply.call(function(err, res){  
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber());
          console.log("res?",res);
          
        }
      });
    });
  }

  async withdraw(){
    let gasPrice = 10000000000;
    let gasLimit;

    try{
      gasLimit = await this._web3.estimateGas(this._account.account.address, this.LSCX_Addr, "", parseInt(this.expected));
    }catch(e){
      gasLimit = await this._web3.blockGas();
    }
    console.log("gasLimit?", gasLimit);
    
    let dialogRef = this._dialog.openGasDialog(await gasLimit, 1);
    dialogRef.afterClosed().subscribe(async result=>{
      /*
      console.log("result",result);
      if(typeof(result) != 'undefined'){
        let obj = JSON.parse(result);

        if(typeof(form.controls.trans_data.value)!="undefined" && form.controls.trans_data.value != ""){
          obj.data = form.controls.trans_data.value;
        }
        tx =  await this._rawtx.createRaw(receiver, form.controls.amount.value, obj)
        this.sendDialogService.openConfirmSend(tx[0], receiver, tx[2],tx[1]-tx[2], tx[1], "send");
      }
      */
      console.log("result del dialogref?",result);
      
      let dialogRef2 = this.dialog.open( WithdrawTxDialog, {
        width: '660px',
        height: '450px',
        data : {
          contract: this._account.account.address,
          fees: gasLimit,
          cost: gasPrice
        }
      }); 
      let self = this;
      dialogRef2.afterClosed().subscribe(async function(pass){
        let title = "Unable to withdraw tokens";
        let message = "Something went wrong"
        let error ="";
        let dialogRef2;
        if(typeof(pass)== 'undefined' || pass==""){
          return false;
        }else{
          dialogRef2 = self.dialog.open( WithdrawDialog,
            {
              width: '660px',
              height: '150px',
              disableClose: true,
            }
          )
            let tx2Data = await self.withdrawReward();
            let txInfo2 = await self.unsignedTx(self.LSCX_Addr ,tx2Data,1000000);
            
            let serialized2 = self.serializeTx(txInfo2[0],pass);
            let sendResult2 = await self._web3.sendRawTx(serialized2);
            if(sendResult2 instanceof Error){
              let error = sendResult2.message;
              dialogRef2.close();
              dialogRef2 = self._dialog.openErrorDialog(title,message,error);
            }else{
              
              let pending: any = await self._web3.getTx(sendResult2);
              pending.timeStamp = Date.now()/1000;
              self._account.addPendingTx(pending);
              title = "Transaction has been sended";
              message = "You can see the transaction in the history tab"
              dialogRef2.close();
              dialogRef2 = self._dialog.openErrorDialog(title,message,error, 'redirect');
              dialogRef2.afterClosed().subscribe(result=>{
                  self.router.navigate(['/wallet/history']);
            })
            }
          }
      });
    })

    //let amount = this._web3.web3.toWei(this.taboowBroker.buyValue);
    

  }

  withdrawReward():string{
    let txData = this.LSCX_Contract.withdrawReward.getData();
    return txData
  }

  async unsignedTx(contractAddr,txData, gas, amount?){
    let gasLimit = gas;
    
    //console.log(amount,"---", gasLimit*2)
    let chainId;
    if(this._web3.network == 1){
      chainId = "0x1";
    }
    if(this._web3.network == 3){
      chainId = "0x3";
    }
    
    let acc = this._account.account;
    console.log("account unsignedTxs", acc);
    
    let amountW = (typeof(amount) == "undefined")? 0 : amount;
    let gasPrice  = this._web3.web3.toWei('10','gwei');
    let nonce = await this._web3.getNonce(acc.address)
    console.log("nonce de este account", nonce);
    console.log("contractAddr", contractAddr);
    

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