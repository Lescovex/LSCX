import { Injectable} from '@angular/core';

import * as Web3L from 'web3';

@Injectable()
export class Web3 {
  web3: Web3L;
  infuraKey = "";
  network
  constructor(){
    this.getInfuraKey();
    if(this.infuraKey!=""){
      if (typeof this.web3 !== 'undefined') {
        this.web3= new Web3L(this.web3.currentProvider);
      } else {  
        // set the provider you want from Web3.providers
        this.web3 = new Web3L(new Web3L.providers.HttpProvider("https://ropsten.infura.io/"+this.infuraKey));
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
    this.network=3;
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
    let value = (typeof(amount)== 'undefined')? 0 : "0x"+amount.toString(16);
    let data2 = this.web3.toHex(data);
    let options = (to=="")? {from: from, data:data2, value:amount}:{from: from, to:to, data:data2, value:amount}
    let self = this;
    return new Promise((resolve, reject)=>{
      self.web3.eth.estimateGas(options,(err, result)=>{
        if(err){
          reject(err)
        }else{
          resolve(result)
        }
        console.log("result",result)
      })
    })

  }
  setProvider(network:number){
    let net = (network==1)? 'mainnet' : 'ropsten'
    let url= "https://"+net+".infura.io/"+this.infuraKey;

    this.web3.setProvider(new Web3L.providers.HttpProvider(url));
  }
  setNetwork(network:number){
    this.network = network;
    let net = (this.network==1)? 'mainnet' : 'ropsten'
    this.web3.setProvider("https://"+net+".infura.io/zsCtddlly08DjGmyIBkH")
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
            console.log(count,": ",tx.blockNumber);
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
      self.web3.toHex(self.web3.eth.getTransactionCount(address, "pending", function(err, nonce) {
        if (!err){
          resolve(nonce)
        }else{
          reject(err)
        }
      }));  
    });

    return await AsyncFunction;
  }

  getTx(txhash){
    let self= this;

    let AsyncFunction = new Promise (function (resolve, reject) {
      let interval;
      self.web3.eth.getTransaction(txhash,function(err,res){
        if (err) {
          console.log("error", err)
          reject(err);
        } else {
          resolve(res); 
        }
      })
    });
    
    return AsyncFunction
  }

}
