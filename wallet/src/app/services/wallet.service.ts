import { Injectable } from '@angular/core';

import * as EthWallet from 'ethereumjs-wallet'
import * as EthUtil from 'ethereumjs-util';

declare var require: any;

const fs = require('fs');
const homedir = require('os').homedir();
const lescovexPath = homedir+"/.lescovex";

@Injectable()
export class WalletService {
  wallet: Array<any>;

  constructor() {
    this.wallet = new Array();
    this.getWallet();
    
  }

  getWallet():void{
    if(localStorage.getItem('ethAcc')){
      this.wallet = JSON.parse(localStorage.getItem('ethAcc'));
    }
  }

  newAccount(name, pass):void {

    let wallet = EthWallet.generate();
    this.addAccount(wallet, pass, name);
   
  }

  importAccountJSON(name, json, pass){
    let acc:any = {}
    let error = false;
    let wallet;
    let self = this;
    try{
        wallet = EthWallet.fromV3(json,pass,true);
    }catch(e){
        error = true
        throw e;
    }
      if(!error){
        this.addAccount(wallet, pass, name);
      }
  }

  importAccountPrivate(name, privateKey,  pass):void{
    let acc:any = {}
    let wallet;
    let error = false;
    try {
      wallet = this.accountFromPrivatekey(privateKey)
    }catch(e) {
      error = true;
      throw e;
    }

    if(!error){      
      this.addAccount(wallet, pass, name);
    } 
  }

  accountFromPrivatekey(privateKey): EthWallet{
    let wallet: EthWallet;
    try{
      wallet = new EthWallet( EthUtil.toBuffer(privateKey));

    }catch(e){
      //error = true;
      throw e;
    }

    return wallet;
  }
  
  addAccount(wallet, pass, name){
    
    let acc = {
      v3 : wallet.toV3(pass),
      address :  wallet.getAddressString(),
      name : name
    }
    let fileName = wallet.getV3Filename();
  
    try{
      this.writeAccountLocally(acc.v3, fileName)
    }catch(e){
      throw new Error("Unable to write file to backup");
    }
     
    if(!localStorage.getItem('ethAcc')){
      let acca= new Array();
      acca[0]=acc;
      localStorage.setItem('ethAcc',JSON.stringify(acca));
  
    }else{
      let  acca= JSON.parse(localStorage.getItem('ethAcc'));
      let err = "";
      
      for (let i = 0; i < acca.length; i++) {
        if(acca[i].address == acc.address){
          err = "This account already exists in your wallet";
        }
      }
      if(err != ""){
        throw new Error(err);  
      }else{
        acca.push(acc);
        localStorage.setItem('ethAcc',JSON.stringify(acca));
      }
      
    }  
    this.getWallet();
  }

  delete(addr):void{
    this.wallet = this.wallet.filter(x => x.address != addr);
    
    if(this.wallet == []){
      localStorage.removeItem('ethAcc');
    }else{
      localStorage.setItem('ethAcc',JSON.stringify(this.wallet));
    }
  }

  getAccount(addr): any{
    let acc = this.wallet.find(x => (x.address).toLowerCase() === addr.toLowerCase());
    return acc;
  }

  writeAccountLocally(v3, fileName){
    if(!fs.existsSync(lescovexPath)){
      fs.mkdirSync(lescovexPath);
    }
    let filePath =lescovexPath+"/"+fileName+".json";
    fs.writeFileSync(filePath , JSON.stringify(v3));
    this.checkFileSaved(v3);

  }

  checkFileSaved(v3){
    let files = fs.readdirSync(lescovexPath);
    
    for(let i=0; i<files.length; i++){
      if(files[i].indexOf(v3.address)){
        let data = fs.readFileSync(lescovexPath+"/"+files[i]);
      }
    }
  }


}
