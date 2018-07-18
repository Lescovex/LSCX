import { Injectable} from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router'

import { WalletService } from './wallet.service'
import { TokenService } from './token.service'
import { Web3 } from "./web3.service";

import * as EthWallet from 'ethereumjs-wallet'

@Injectable()
export class AccountService{
  account : any = {};
  pending: Array<any> = [];
  events : Array<any> = [];
  marginCalls : Array<any> = [];
  interval;

  constructor(private http: Http, private _wallet : WalletService, private _token : TokenService,private _web3: Web3, private router: Router){
    //Hardcode
    this.getAccountData();
    if('address' in this.account){
      this.startIntervalData();

    }
  }

  setAccount(account){
    if('address' in this.account && typeof(this.account.address)!= "undefined"){
      clearInterval(this.interval)
    }
      this.account = account;
      localStorage.setItem('acc',JSON.stringify(account.address));
      console.log(this.interval)
      this.startIntervalData();
      this.setTokens();
    
    this.router.navigate(['/wallet/global']);
    
  }
  
  refreshAccount(){
    localStorage.removeItem('acc');
    this.getAccountData();
    if(typeof(this.account.address) == "undefined"){
      clearInterval(this.interval)
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

  setData(){
    let addr = this.account.address;
    let self= this;
    this._web3.web3.eth.getBalance(addr,(err,result)=>{
      self.account.balance = self._web3.web3.fromWei(result.toNumber(),'ether');
    })

    this.getTx(addr).subscribe((resp:any) =>{
      let history = [];
      history =  resp.result;
      history = history.reverse();
      for(let i = 0; i<this.pending.length; i++){
        let result = history.findIndex(x => (x.hash).toLowerCase() === this.pending[i].hash.toLowerCase());
        if(result == -1){
          history.unshift(this.pending[i]);
        }else{
          this.pending.splice(i,1)
          this.removePendingTx();
        }
      }

      for(let i =0; i<history.length; i++){
        let date = this.tm(history[i].timeStamp);
        history[i].date = date;
      }
      this.account.history = history;
    }); 
  }
  
  getAccountData(){
    this.account = this.getAccount();
    
    if(Object.keys(this.account).length != 0){
      this.getPendingTx();
      this.setData();
      this.setTokens();
    }
  }

  getTx(addr): Observable<any> {
    
    //Ojo ropsten
    
    //let url = 'http://api.etherscan.io/api?module=account&action=txlist&address=0x74FD51a98a4A1ECBeF8Cc43be801cce630E260Bd&startblock=0&endblock=99999999&sort=asc&apikey='+this._wallet.apikey;
    let url = 'http://api-ropsten.etherscan.io/api?module=account&action=txlist&address='+addr+'&startblock=0&endblock=99999999&sort=asc&apikey='+this._wallet.apikey;
    // let url 'http://api.etherscan.io/api?module=account&action=txlist&address='+addr+'&startblock=0&endblock=99999999&sort=asc&apikey='+this._wallet.apikey;

    let response = this.http.get(url).map(res => res.json());
    return response;
  }

  getTokensTransfers(addr): Observable<any> {
    //Ropsten
    //let url = 'http://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=0x160A616506F77aaa7313b80DC5e4FDFC7a1A1827&startblock=0&endblock=999999999&sort=asc&apikey=YourApiKeyToken'
    let url = 'http://api-ropsten.etherscan.io/api?module=account&action=tokentx&address='+addr+'&startblock=0&endblock=99999999&sort=asc&apikey='+this._wallet.apikey;
    // let url 'http://api.etherscan.io/api?module=account&action=txlist&address='+addr+'&startblock=0&endblock=99999999&sort=asc&apikey='+this._wallet.apikey;

    let response = this.http.get(url).map(res => res.json());
    return response;
  }
  getTokensLocale(){
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      if(wallet[result].hasOwnProperty('tokens')){
        return wallet[result].tokens;
      }else{
        return new Array();;
      }
    }
  }

  async setTokens(){
    let self = this;
    this.account.tokens = [];
    if('address' in this.account){
      let tokens = this.getTokensLocale();
      tokens = await this.updateTokens(tokens);
      this.getTokensTransfers(this.account.address).subscribe(async function(resp:any){
        let tkns : Array<any> = [];
        tkns = resp.result;
        self.account.tokens=[];
        for(let i = 0; i<tkns.length; i++){
          if(tokens.findIndex(x=> x.contractAddress == tkns[i].contractAddress) == -1){
            let token: any = {
              contractAddress :  tkns[i].contractAddress,
              tokenName:  tkns[i].tokenName,
              tokenSymbol:  tkns[i].tokenSymbol,
              tokenDecimal: parseInt( tkns[i].tokenDecimal),
            }
            token = await self.updateTokenBalance(token)
            tokens.push(token)
          }
        }
        self.account.tokens = tokens;
        let wallet = JSON.parse(localStorage.getItem('ethAcc'));
        let result = wallet.findIndex(x => x.address == self.account.address);
        wallet[result].tokens = self.account.tokens;

        localStorage.setItem('ethAcc',JSON.stringify(wallet));
      });
    }
  }
  
  addToken(token){
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x =>x.address == this.account.address);
      if('tokens' in wallet[result]){
        this.account.tokens.push(token);
        wallet[result].tokens.push(token);
      }else{
        this.account.tokens = [token]
        wallet[result].tokens = [token]
      }

      localStorage.setItem('ethAcc',JSON.stringify(wallet));
    }
  }
  async updateTokens(tokens){
    for(let i = 0; i<tokens.length; i++){
      tokens[i] = await this.updateTokenBalance(tokens[i])
    }
    return tokens;
  }
  
  async updateTokenBalance(token){
    this._token.setToken(token.contractAddress);
    let exp = 10 ** token.tokenDecimal;
    let balance : any = await this._token.getBalanceOf(this.account.address);
    token.balance = balance.div(exp).toNumber();
    return token
  }
  
  
  getPendingTx(){
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      if(wallet[result].hasOwnProperty('pending')){
        this.pending= wallet[result].pending;
      }
    }
  }
  
  addPendingTx(tx){
    this.pending.push(tx);
    if(localStorage.getItem('ethAcc')){
      let wallet = JSON.parse(localStorage.getItem('ethAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      wallet[result].pending = this.pending;
      localStorage.setItem('ethAcc',JSON.stringify(wallet));
    }
    this.setData();
  }

  removePendingTx(){
    let wallet = JSON.parse(localStorage.getItem('ethAcc'));
    let result = wallet.findIndex(x => x.address == this.account.address);
    wallet[result].pending = this.pending;
    localStorage.setItem('ethAcc',JSON.stringify(wallet));
  }

  getPrivateKey(pass){
    let wallet = EthWallet.fromV3(this.account.v3, pass);
    return wallet.getPrivateKey();
  }
  startIntervalData(){
    this.setData();
    this.interval = setInterval(()=>{
      this.setData();
    },3000); 
      
  }
  startIntervalTokens(){
    return setInterval(()=>{
      this.updateTokens(this.account.tokens)
    },3000);
  }

  tm(unix_tm) {
    let dt = new Date(parseInt(unix_tm)*1000); // Devuelve más 2 horas
    let  strDate = dt.getUTCDate()+"-"+(dt.getUTCMonth()+1)+"-"+dt.getUTCFullYear();
    return strDate;
  }

}