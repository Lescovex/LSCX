import { Injectable} from '@angular/core';
import { Router } from '@angular/router'

import { WalletService } from './wallet.service'
import { TokenService } from './token.service'
import { Web3 } from "./web3.service";
import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../components/dialogs/loading-dialog.component';

import * as EthWallet from 'ethereumjs-wallet'
import { EtherscanService } from './etherscan.service';

@Injectable()
export class AccountService{
  updated = false;
  updatedTokens = false;
  newUpdateTokens = false;
  account : any = {};
  tokens: Array<any> = [];
  pending: Array<any> = [];
  events : Array<any> = [];
  marginCalls : Array<any> = [];
  interval;
  tokenInterval;
  apikey: string = "";
  loadingD;

  constructor(private _wallet : WalletService, protected dialog: MdDialog, private _token : TokenService,private _web3: Web3, private router: Router, private _scan: EtherscanService){

    Promise.resolve().then(() => {
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    });

    this._scan.getApiKey();
    if(this._scan.apikey != "" && this._web3.infuraKey != ""){
      if(localStorage.getItem('acc')){
        this.getAccountData();
        if('address' in this.account){
          this.startIntervalData();
          this.newUpdateTokens = true;
          this.tokens = [];
        }
      }else{
        Promise.resolve().then(() => {
          this.loadingD.close();
        });
      }

    }
  }

  async setAccount(account){
    Promise.resolve().then(() => {
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    });
    if('address' in this.account && typeof(this.account.address)!= "undefined"){
      clearInterval(this.interval)
      this.clearIntervalTokens();

    }
    this.router.navigate(['/wallet/global']);
    this.account = account;
    localStorage.setItem('acc',JSON.stringify(account.address));
    this.tokens = [];
    await this.getPendingTx();
    await this.startIntervalData();
    this.newUpdateTokens = true;
    await this.setTokens();

  }

  async refreshAccountData(){
      this.updatedTokens = false;
      clearInterval(this.interval)
      this.clearIntervalTokens();
      this.getPendingTx();
      await this.startIntervalData();
      this.newUpdateTokens = true;
      this.activateLoading();
      await this.setTokens();

  }

  refreshAccount(){
    localStorage.removeItem('acc');
    this.getAccountData();
    if(typeof(this.account.address) == "undefined"){
      clearInterval(this.interval);
      this.clearIntervalTokens();
    }
    this.router.navigate(['/wallet/global']);
  }

  getAccount(){
    let acc:any = {};
    if(localStorage.getItem('acc') &&  localStorage.getItem('acc')!= 'undefined'){
      let addr = JSON.parse(localStorage.getItem('acc'));
      acc = this._wallet.getAccount(addr);
    }else if(this._wallet.wallet !== null && this._wallet.wallet.length >0){
      acc = this._wallet.wallet[0];
      localStorage.setItem('acc', JSON.stringify(acc.address));
    }else{
      acc = {};
    }
    return acc;
  }

  async setData(){
    let addr = this.account.address;
    let self= this;
    try {
      self.account.balance = await this._web3.getBalance(addr);
    } catch (error) {
      console.log(error);
      if(this.loadingD != null){
        this.loadingD.close();
      }

    }
    let history;
    try {
      history = await this._scan.getHistory(addr);
    } catch (error) {
      console.log(error);
      if(this.loadingD != null){
        this.loadingD.close();
      }
    }

    for(let i = 0; i<this.pending.length; i++){
      let result = history.findIndex(x => (x.hash).toLowerCase() == this.pending[i].hash.toLowerCase());
      let result2 = history.findIndex(x => x.nonce == this.pending[i].nonce && x.from.toLowerCase() == this.account.address.toLowerCase());
      if(result == -1 && result2 == -1){
        history.unshift(this.pending[i]);
      }else{
        this.removePendingTx(i);
      }
    }
    if(typeof history != 'undefined'){
      for(let i =0; i<history.length; i++){
        let date = this.tm(history[i].timeStamp);
        history[i].date = date;
      }
      this.account.history = await history;
      this.updated=true;
    }

  }

  async getAccountData(){
    this.account = this.getAccount();

    if(Object.keys(this.account).length != 0){
      await this.getPendingTx();
      await this.setData();
      await this.setTokens();

    }
  }

  getTokensLocale(){
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      if(wallet[result].hasOwnProperty('tokens')){
        let tokens = wallet[result].tokens.filter(x=> x.network == this._web3.network.chain)
        return tokens;
      }else{
        return [];
      }
    }
  }

  async setTokens(){
    this.tokens = [];
    this.updatedTokens =false;
    if('address' in this.account){
      this.tokens = this.getTokensLocale();
      await this.updateTokens();
    }
    this.updatedTokens = true;
  }

  saveAccountTokens(){
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address.toLowerCase() == this.account.address.toLowerCase());
      wallet[result].tokens = this.tokens;
    }
  }

  addToken(token){
      if('tokens' in this.account){
        this.tokens.push(token);
      }else{
        this.tokens = [token]
      }
      this.saveAccountTokens();
  }

  deleteToken(tokenAdrr){
      if('tokens' in this.account){
        this.tokens.forEach(tk=>{
          if(tk.contractAddress == tokenAdrr){
            tk.deleted = true;
          }
        })
      }
      this.saveAccountTokens();
  }

  async updateTokens(){
    let self = this;
    let tokens : Array<any> = [];

    for(let i = 0; i < tokens.length; i++){
      if(i==0) {
        this.newUpdateTokens=false;
      }
      if(this.newUpdateTokens==true){
        return false;
      }else{
        tokens[i] = await this.updateTokenBalance(tokens[i]);
      }
    }
    let transfersError= null;
    let resultTokens;
    try {
      resultTokens =  await this._scan.getTokensTransfers(this.account.address).toPromise();
    } catch (error) {
      console.log(error);
      transfersError = error;
      if(this.loadingD != null){
        this.loadingD.close();
      }
    }

    if(transfersError == null){
      let tkns : Array<any> = [];
      tkns = resultTokens.result;

      if(tkns != null){
        for(let i = 0; i<tkns.length; i++){
          if(i==0) {
            this.newUpdateTokens=false;
          }
          if(this.newUpdateTokens==true){
            return false;
          }
          if(tokens.findIndex(x=> x.contractAddress == tkns[i].contractAddress) == -1){

            let token: any = {
              contractAddress :  tkns[i].contractAddress,
              tokenName:  tkns[i].tokenName,
              tokenSymbol:  tkns[i].tokenSymbol,
              tokenDecimal: parseInt(tkns[i].tokenDecimal),
              network : self._web3.network,
              deleted: false
            }

            token = await self.updateTokenBalance(token);

            if(!isNaN(token.tokenDecimal) && token.tokenName != "" && token.tokenSymbol != ""){
                tokens.push(token);
            }
          }
        }

          self.tokens = await tokens;
          self.saveAccountTokens();

          if(this.loadingD != null){
            this.loadingD.close();
          }
      }
    }
  }

  async updateTokenBalance(token){

    if(!('balance' in token) || !token.deleted){
      this._token.setToken(token.contractAddress);
      if(isNaN(token.tokenDecimal) || token.tokenDecimal == 0|| token.tokenName=="" || token.tokenSymbol==""){
        token.tokenName = await this._token.getName();
        token.tokenSymbol = await this._token.getSymbol();
        token.tokenDecimal = await this._token.getDecimal();
      }
      let exp = 10 ** token.tokenDecimal;
      let balance : any = await this._token.getBalanceOf(this.account.address);
      token.balance = balance.div(exp).toNumber();

    }

    return token;
  }


  getPendingTx(){
    this.pending=[];
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      if(wallet[result].hasOwnProperty('pending')){
        this.pending= wallet[result].pending.filter(x=> x.network == this._web3.network.chain);
      }
    }
  }

  async addPendingTx(tx){
    tx.network = this._web3.network.chain;
    let pendings = this.pending.filter(x=> x.nonce != tx.nonce);
    pendings.push(tx);
    this.pending= pendings;
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      wallet[result].pending = this.pending;
      localStorage.setItem('ethAcc',JSON.stringify(wallet));
    }
    await this.setData();
  }

  removePendingTx(index){
    this.pending.splice(index,1);
    let wallet = JSON.parse(localStorage.getItem('ethAcc'));
    let result = wallet.findIndex(x => x.address == this.account.address);
    wallet[result].pending = this.pending;
    localStorage.setItem('ethAcc',JSON.stringify(wallet));
  }

  getPrivateKey(pass){
    let wallet = EthWallet.fromV3(this.account.v3, pass);
    return wallet.getPrivateKey();
  }

  async startIntervalData(){
    await this.setData();
    this.interval = setInterval(async ()=>{
      await this.setData();
    },3000);

  }

  async startIntervalTokens(){
    let time = 1000;
    if(this.tokens.length>0){
      time = this.tokens.length * 1500;
    }
    this.tokenInterval = setInterval(async()=>{
      if(this.tokens != []){
        await this.updateTokens();
      }
    },60000);
  }

  clearIntervalTokens(){
    clearInterval(this.tokenInterval);
    this.tokenInterval = null;
  }

  tm(unix_tm) {
    let dt = new Date(parseInt(unix_tm)*1000);
    let  strDate = dt.getUTCDate()+"-"+(dt.getUTCMonth()+1)+"-"+dt.getUTCFullYear();
    return strDate;
  }
  activateLoading(){
    Promise.resolve().then(() => {
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    });
  }
}