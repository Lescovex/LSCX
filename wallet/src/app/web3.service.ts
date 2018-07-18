import { Injectable} from '@angular/core';

var Web3L = require('web3');

@Injectable()
export class Web3 {
  web3;
  constructor(){
    if (typeof this.web3 !== 'undefined') {
      this.web3= new Web3L(this.web3.currentProvider);
    } else {  
      // set the provider you want from Web3.providers
      this.web3 = new Web3L(new Web3L.providers.HttpProvider("https://ropsten.infura.io/zsCtddlly08DjGmyIBkH"));
    }
  }
  estimateGas(from, to, data, amount?):Promise<number>{
    let value = (typeof(amount)== 'undefined')? 0 : "0x"+amount.toString(16)
    //console.log("from:", from,", to:",to,", data:",data,", value:",amount)
    let self = this;
    return new Promise((resolve, reject)=>{
      self.web3.eth.estimateGas({from: from,to:to,data:data, value:amount},(err, result)=>{
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
    this.web3.setProvider("https://"+net+".infura.io/zsCtddlly08DjGmyIBkH")
  }

  async getBlockTimestamp(txhash){
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
                let timestamp =  self.web3.eth.getBlock(tx.blockNumber).timestamp;
                let status = self.web3.eth.getTransactionReceipt(txhash).status;
                console.log('echooo, ',tx.blockNumber, ": ", timestamp,"--", status)
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
