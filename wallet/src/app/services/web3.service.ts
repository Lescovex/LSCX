import { Injectable} from '@angular/core';

import * as Web3L from 'web3';

@Injectable()
export class Web3 {
  web3: Web3L;
  infuraKey = "";
  network: number;
  constructor(){
    this.getIntialNetwork();
    this.getInfuraKey();
    if(this.infuraKey!=""){
      if (typeof this.web3 !== 'undefined') {
        this.web3= new Web3L(this.web3.currentProvider);
      } else {  
        // set the provider you want from Web3.providers
        this.setProvider();
      }
    }else{
      this.web3= new Web3L()
    }
  }

  setInfuraKey(apikey){
    this.infuraKey = apikey;
    let apikeys: any = {};
    if(localStorage.getItem('apikeys')){
      apikeys = JSON.parse(localStorage.getItem('apikeys'));
    }
      apikeys.inf = apikey;
      localStorage.setItem('apikeys', JSON.stringify(apikeys));
  }

  getInfuraKey(){
    if(localStorage.getItem('apikeys')){
      let apikeys : any = JSON.parse(localStorage.getItem('apikeys'));
      if('inf' in apikeys){
        this.infuraKey = apikeys.inf;
      }
    }
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

  setProvider(){
    let net = (this.network==1)? 'mainnet' : 'ropsten'
    let url= "https://"+net+".infura.io/"+this.infuraKey;
    this.web3 = new Web3L(new Web3L.providers.HttpProvider(url));
  }

  setNetwork(network:number){
    this.network = network;
    localStorage.setItem('network', JSON.stringify(network))
    let net = (this.network==1)? 'mainnet' : 'ropsten'
    this.setProvider();
  }

  getIntialNetwork() {
    if(!localStorage.getItem('network')){
      this.network = 1
    }else{
      this.network = JSON.parse(localStorage.getItem('network'));
    }
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
            if(res.contractAddress!= null){
              resolve(res.contractAddress)
            }
          } 
        }
      })
    });
      
    return await AsyncFunction;
  }

  async sendRawTx(txData:string){

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
      self.web3.eth.getTransactionCount(address, "pending", function(err, nonce) {
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
