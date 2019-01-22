import { Injectable} from '@angular/core';

import * as Web3L from 'web3';

@Injectable()
export class Web3 {
  web3: Web3L;
  infuraKey = "d975dfec3852411890cd72311dd91184";
  network: any;
  NETWORKS: any[] = [{chain:1, name: "Main Ethereum Network", urlStarts:"mainnet"}, {chain:3, name: "Ropsten Test Network", urlStarts:"ropsten"}, {chain:42, name: "Kovan Test Network", urlStarts:"kovan"}];
  constructor(){
    this.getIntialNetwork();
    if (typeof this.web3 !== 'undefined') {
        this.web3= new Web3L(this.web3.currentProvider);
    } else {  
        // set the provider you want from Web3.providers
        this.setProvider();
    }
  }

  setProvider(){
    let net = this.network.urlStarts;
    let url= "https://"+net+".infura.io/v3/"+this.infuraKey;
    this.web3 = new Web3L(new Web3L.providers.HttpProvider(url));
  }

  setNetwork(networkObj:any){
    this.network = networkObj;
    localStorage.setItem('network', JSON.stringify(this.network.chain))
    this.setProvider();
  }

  getIntialNetwork() {
    if(!localStorage.getItem('network')){
      this.network = this.NETWORKS[0]
    }else{
      let chain = JSON.parse(localStorage.getItem('network'));
      this.network = this.NETWORKS.find(x=> x.chain == chain);
    }
  }

  getBalance(addr):Promise<number>{
    let self= this;
    return new Promise((resolve, reject)=>{
      this.web3.eth.getBalance(addr,(err,result)=>{
        if(err){
          console.log(err)
          this.getBalance(addr)
          //reject(err);
        }else{
          resolve(parseFloat(self.web3.fromWei(result.toNumber(),'ether')));
        }
      })
    })
  }

  estimateGas(from, to, data, amount?):Promise<number>{
    let options: any={from}
    
    options.value = (typeof(amount)== 'undefined' || amount==0)? 0 : "0x"+amount.toString(16);
    if(to != ''){
      options.to = to
    }
    if(data != ''){
      options.data = this.web3.toHex(data)
    }
    let self = this;
    
    return new Promise((resolve, reject)=>{
      self.web3.eth.estimateGas(options,(err, result)=>{
        if(err){
          reject(err)
        }else{
          resolve(result)
        }
      })
    })
  }

  blockNumber():Promise<number> {
    let self = this;
    return new Promise((resolve, reject)=>{
      self.web3.eth.getBlockNumber((err, result)=>{
        if(err){
          let blockNumber = self.web3.eth.blockNumber;
          resolve(blockNumber);
        }else{
          resolve(result)
        }
      })
    })
  }
  
  async blockGas(){
    let self = this;
    let block = await this.blockNumber();
    return new Promise((resolve, reject)=>{
      self.web3.eth.getBlock(block, (err, result)=>{
        if(err){
          reject(err)
        }else{
          resolve(result.gasLimit)
        }
      })
    });
  }

  async getTxStatus(txhash){
    let tx: any = await this.getTx(txhash);
    let self= this;
    let recepit;
    let interval;
    let AsyncFunction = new Promise (function (resolve, reject) {      
        if (tx.blockNumber == null) {
          let count = 0;          
          interval = setInterval( async function(){
            tx = await self.getTx(txhash);
            if(tx.blockNumber != null){  
              clearInterval(interval)
              
              interval = setInterval(function(){
                let status = self.web3.eth.getTransactionReceipt(txhash).status;
                if(status==1 || status==0){
                  clearInterval(interval)
                  resolve(parseInt(status)); 
                }
              }) 
            }
            count ++
          }, 2000)
        }
    });
      
    return await AsyncFunction;
  }

  async getTxContractAddress(txhash){
    let self= this;
    let interval;
    
    let AsyncFunction = new Promise (function (resolve, reject) {      
      self.web3.eth.getTransactionReceipt(txhash, function(err, res) {
       
        if (!err){
          if(res!= null){
              resolve(res.contractAddress)
          }else{
            resolve(null)
          } 
        }
      })
    });    
    return await AsyncFunction;
  }

  async sendRawTx(txData:string){
    console.log("sendRawTx",txData);
    
    let self= this;

    let AsyncFunction = new Promise (function (resolve, reject) {      
      self.web3.eth.sendRawTransaction(txData, function(err, hash) {
        if (!err){
          resolve(hash)
        }else{
          resolve(err)
        }
      })
    });

    return await AsyncFunction;
  }

  async getNonce(address){

    let self= this;

    let AsyncFunction = new Promise (function (resolve, reject) {
      self.web3.eth.getTransactionCount(address, function(err, nonce) {
        if (!err){
          resolve(nonce)
        }else{
          reject(err)
        }
      });  
    });

    return await AsyncFunction;
  }

  getTx(txhash){
    let self= this;

    let AsyncFunction = new Promise (function (resolve, reject) {
      self.web3.eth.getTransaction(txhash,function(err,res){
        if (err) {
          reject(err);
        } else {
          resolve(res); 
        }
      })
    });
    
    return AsyncFunction
  }

  getReceipt(txhash){
    let self= this;

    let AsyncFunction = new Promise (function (resolve, reject) {
      self.web3.eth.getTransaction(txhash,function(err,res){
        if (err) {
          reject(err);
        } else {
          resolve(res); 
        }
      })
    });
    
    return AsyncFunction
  }

  getGasPrice():Promise<number>{
    let self= this;

    return new Promise (function (resolve, reject) {
      self.web3.eth.getGasPrice(function(err,res){
        if (err) {
          reject(err);
        } else {
          resolve(res.toNumber()); 
        }
      })
    });
  }

}
