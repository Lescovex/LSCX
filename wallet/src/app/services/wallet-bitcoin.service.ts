import { Injectable } from '@angular/core';


var bitcoin = require("bitcoinjs-lib");
var bs58check = require('bs58check');
var CryptoJS = require("crypto-js");

@Injectable()
export class BitcoinWalletService {
  wallet: Array<any>;

  constructor() {
    this.wallet = new Array();
    if(localStorage.getItem('btcAcc')){
      this.getFinishW();    
    }
    
  }

  getFinishW():void{
    this.wallet = JSON.parse(localStorage.getItem('btcAcc'));
  }

  newAccount(name, pass):void {
    //create elements
    let btc = bitcoin.networks.bitcoin;
    let keyPair = bitcoin.ECPair.makeRandom({network:btc})
    let wif = keyPair.toWIF();
    
    
    let addr  = bitcoin.payments.p2pkh({network: btc, pubkey: keyPair.publicKey});
    let privateK = bs58check.decode(keyPair.toWIF()).toString('hex');
    var ciphertext = CryptoJS.AES.encrypt(wif, pass);
    
    let storewif = ciphertext.toString();
    
    //Saving data
    let acc = {
        name : name,
        address : addr.address,
        wif : storewif
    }
    
    this.addAccount(acc);
  }

  
  
  importAccountWIF(name, wif, pass){
 
    let btc = bitcoin.networks.bitcoin;
    let acc:any = {}
    let error = false;
    let wallet;
    let self = this;

    let keyPair;
    let addr;
    let ciphertext;
    let storewif
 
    try{
        keyPair = bitcoin.ECPair.fromWIF(wif)
        addr  = bitcoin.payments.p2pkh({network: btc, pubkey: keyPair.publicKey});
        ciphertext = CryptoJS.AES.encrypt(wif, pass);
        
        storewif = ciphertext.toString();
        
    } catch(e) {
        error = true
        throw e;
    }
      if(!error){
        acc.name = name;
        acc.address = addr.address;
        acc.wif = storewif
        
        self.addAccount(acc);
      }
  }

  
  addAccount(acc):void{  
    if(!localStorage.getItem('btcAcc')){
      let acca= new Array();
      acca[0]=acc;
      localStorage.setItem('btcAcc',JSON.stringify(acca));
  
    }else{
      let  acca= JSON.parse(localStorage.getItem('btcAcc'));
      acca.push(acc);
      localStorage.setItem('btcAcc',JSON.stringify(acca));
    }
    localStorage.setItem('accBTC', JSON.stringify(acc.address));
     this.getFinishW();//To refresh wallet
  }

  delete(addr):void{
    let index = this.wallet.findIndex(x => x.address === addr);
    
    if(index > -1){
      this.wallet.splice(index,1);
      localStorage.setItem('btcAcc',JSON.stringify(this.wallet));
      this.getFinishW(); //To refresh wallet
    }
  }

  getAccount(addr): any{
    let acc = this.wallet.find(x => (x.address).toLowerCase() === addr.toLowerCase());
    return acc;
  }

}
