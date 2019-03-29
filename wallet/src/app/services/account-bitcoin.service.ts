import { Injectable} from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { MdDialog } from '@angular/material';
import { LoadingDialogComponent } from '../components/dialogs/loading-dialog.component';

import { BitcoinWalletService } from './wallet-bitcoin.service';
import { DialogService } from "./dialog.service";
import { ERROR_LOGGER } from '../../../node_modules/@angular/core/src/errors';

const classify = require('bitcoinjs-lib/src/classify')

var bitcoin = require("bitcoinjs-lib");
var ElectrumCli = require('electrum-client');


@Injectable()
export class BitcoinAccountService{
  account : any = {};
  pending: Array<any> = [];
  events : Array<any> = [];
  marginCalls : Array<any> = [];
  interval;
  loadingD;
  block;
  public moment = require('moment');
  public config;
  public configFile;
  serverError;
  constructor(private dialog: MdDialog, private http: Http, private _wallet : BitcoinWalletService, private router: Router, public _dialog : DialogService){
    this.configFile = require("../../libs/btc/config.json");
    this.checkServer();
  }

  async setAccount(account){

    this.loadingD = this.dialog.open(LoadingDialogComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });

    if('address' in this.account && typeof(this.account.address)!= "undefined"){
      await clearInterval(this.interval)
    }
      if(typeof(this.account.address) != "undefined"){
        await clearInterval(this.interval)
      }
      this.account = account;
      localStorage.setItem('accBTC',JSON.stringify(account.address));
      //await this.getPendingTx();
      this.account.history = null;
      await this.startIntervalData();


  }

  refreshAccount(){
    localStorage.removeItem('accBTC');
    this.getAccountData();
    if(typeof(this.account.address) == "undefined"){
      clearInterval(this.interval)
    }
    //this.router.navigate(['/btcwallet/btcglobal']);
  }

  getAccount(){
    let acc:any = {};
    if(localStorage.getItem('accBTC') &&  localStorage.getItem('accBTC')!= 'undefined'){
      let addr = JSON.parse(localStorage.getItem('accBTC'));
      acc = this._wallet.getAccount(addr);
    }else if(this._wallet.wallet !== null && this._wallet.wallet.length >0){
      acc = this._wallet.wallet[0];
      localStorage.setItem('accBTC', JSON.stringify(acc.address));
    }else{
      acc = {};
    }
    if(localStorage.getItem('accBTC') == 'undefined'){
      localStorage.removeItem('accBTC');
    }
    return acc;
  }

  async setData(){

    let addr = this.account.address;
    let self= this;
    let script = bitcoin.address.toOutputScript(addr)
    let hash = bitcoin.crypto.sha256(script)
    let reversedHash = new Buffer(hash.reverse())
    let scripthash  = reversedHash.toString('hex');
    let history = new Array()

    try {

      const ecl = new ElectrumCli(this.config.port, this.config.url, 'tcp');

      try {
        await ecl.connect();
      } catch (error) {
        //console.log("setData error", error);

      }
      const ver = await ecl.server_version("1.8.12","1.4");
      let prevBalance = await ecl.blockchainScripthash_getBalance(scripthash);

      self.account.balance = prevBalance.confirmed;
      let data = await ecl.blockchainScripthash_getHistory(scripthash);
      //console.log("history",data);
      let net = bitcoin.networks.bitcoin;
      var currentBlock = await ecl.blockchainHeaders_subscribe();
      this.block = currentBlock.height;
      let transactions = [];
      let storeInfo
      if(typeof data != 'undefined'){
        console.log("si el historial no es undefined")
        for (let index = 0; index < data.length; index++) {
          console.log("index data", index)
          let status;
          let confirmations;
          let action;
          let amount = 0;
          let balance = 0;
          let transaction_hash = await ecl.blockchainTransaction_get(data[index].tx_hash, data[index].height)
          //console.log(transaction_hash)
          let tx = bitcoin.Transaction.fromHex(transaction_hash);
          //console.log("decodedtx hash",tx)
          let header = await ecl.blockchainBlock_getHeader(data[index].height);
          console.log("transaction header", header)

          let format =  this.decodeFormat(tx);
          var inputs = this.decodeInput(tx);
          var outputs = this.decodeOutput(tx, net)

          if(header.block_height == 0){
            status = 'Pending';
            confirmations = 0;
          } else {
            status = 'Confirmed';
            confirmations = this.block - header.block_height;
          }

          let val = this.account.address;
          var indexIn = -1;
          var indexOut = -1;
          var indexOther = -1;

          // Check if my address exists on inputs
          for (let j = 0; j < inputs.length; j++) {
              if(val == inputs[j].address){
                indexIn = j;
              }
          }
          // find if my account is in outputs
          indexOut = outputs.findIndex(function(item){
            return item.scriptPubKey.addresses[0] === val;
          });
          //have to check if other account that don't be mine exists in outputs
          indexOther = outputs.findIndex(function(item){
            return item.scriptPubKey.addresses[0] !== val;
          });

          if(indexIn != -1){
            action = 'send';
            amount = 0;
            for (let k = 0; k < outputs.length; k++) {
              if(outputs[k].scriptPubKey.addresses[0] != this.account.address){
                amount = amount + outputs[k].satoshi
                if(indexOut != -1){
                  balance = outputs[indexOut].satoshi;
                } else {
                  balance = 0;
                }
              }
            }

            if(indexOut != -1 && indexOther == -1){
              action = 'self';
              if(index != 0){
                let prevBalance = transactions[index-1].balance;
                amount = prevBalance-outputs[indexOut].satoshi;
                balance = outputs[indexOut].satoshi;
              } else {
                amount = outputs[indexOut].satoshi;
              }
            }
        } else {
          action = 'receive';
          amount = outputs[indexOut].satoshi;
          if(index != 0){
            let prevBalance = transactions[index-1].balance;
            balance = prevBalance+outputs[indexOut].satoshi;
          } else {
            balance = outputs[indexOut].satoshi;
          }

        }
        storeInfo = {action: action, date: header.timestamp, state: status, amount: amount, balance: balance, confirmations: confirmations};
        transactions.push(storeInfo);
        console.log("storeInfo?",storeInfo)
        console.log("transactions", transactions)
      }
      history = transactions.reverse();
      this.account.history = history;
      console.log("transactions?",transactions)
      if(this.loadingD != null){
        this.loadingD.close();
      }
      }
      //inside try connection
      } catch (error) {
      //console.log(error);
    }
  }

  async checkServer(){
    let load;
    let index = 0;
    Promise.resolve().then(() => {
      load = this._dialog.openLoadingDialog();
    });
    while (index < this.configFile.servers.length) {
      try {
        const ecl = new ElectrumCli(this.configFile.servers[index].port, this.configFile.servers[index].url, 'tcp');
        await ecl.connect();
        await load.close();
        this.config = this.configFile.servers[index];
        if(this.serverError != null){
          this.serverError = null;
        }
        this.getAccountData();
        index = this.configFile.servers.length +1;
      } catch (error) {
        index = index + 1;
        if(index == this.configFile.servers.length){
          let title = 'Unable to connect to BTC server';
          let message = 'Something was wrong';
          load.close();
          let dialogRef = this._dialog.openErrorDialog(title, message, error);
          clearInterval(this.interval);
          this.serverError = "Unable to connect to BTC server";
          throw new Error(error);
        }
      }
    }
  }

  async getAccountData(){
    try {
    const ecl = new ElectrumCli(this.config.port, this.config.url, 'tcp');
    await ecl.connect();
    this.serverError = null;
    } catch (error) {
      let title = 'Unable to connect to BTC server';
      let message = 'Something was wrong';
      let dialogRef = this._dialog.openErrorDialog(title, message, error);
      clearInterval(this.interval);
      this.serverError = "Unable to connect to BTC server";
      throw new Error(error);
    }

    this.account = this.getAccount();
    console.log("this.account",this.account);
    if(localStorage.getItem('accBTC')){

      await this.setAccount(this.account);
      await this.getAccountsBalances();

      if(Object.keys(this.account).length != 0){
        this.getPendingTx();
        await this.setData();
      }
    }

  }

  getPendingTx(){
    if(localStorage.getItem('btcAcc')){
      let wallet = JSON.parse(localStorage.getItem('btcAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      if(wallet[result].hasOwnProperty('pending')){
        this.pending= wallet[result].pending;
      }
    }
  }

  async getAccountsBalances(){
    let addr;
    let script;
    let hash;
    let reversedHash;
    let scripthash;
    let ecl;
    let ver;
    let prevBalance;
    if(localStorage.getItem('btcAcc')){
      let storage = JSON.parse(localStorage.getItem('btcAcc'));
      for (let i = 0; i < storage.length; i++) {
        addr = storage[i].address;
        //storage[i].address
        script = bitcoin.address.toOutputScript(storage[i].address)
        hash = bitcoin.crypto.sha256(script)
        reversedHash = new Buffer(hash.reverse())
        scripthash  = reversedHash.toString('hex');

        ecl = new ElectrumCli(this.config.port, this.config.url, 'tcp');

        try {
          await ecl.connect();
        } catch (error) {
          console.log("getAccountBalancesError",error);

        }

        ver = await ecl.server_version("1.8.12","1.4");
        prevBalance = await ecl.blockchainScripthash_getBalance(scripthash);

        if(prevBalance == null){
          prevBalance = 0;
        }

        storage[i].balance = prevBalance.confirmed;

      }
      localStorage.setItem('btcAcc',JSON.stringify(storage));
    }
  }

  addPendingTx(tx){
    this.pending.push(tx);
    if(localStorage.getItem('btcAcc')){
      let wallet = JSON.parse(localStorage.getItem('btcAcc'));
      let result = wallet.findIndex(x => x.address == this.account.address);
      wallet[result].pending = this.pending;
      localStorage.setItem('btcAcc',JSON.stringify(wallet));
    }
    this.setData();
  }

  removePendingTx(){
    let wallet = JSON.parse(localStorage.getItem('btcAcc'));
    let result = wallet.findIndex(x => x.address == this.account.address);
    wallet[result].pending = this.pending;
    localStorage.setItem('btcAcc',JSON.stringify(wallet));
  }

  async startIntervalData(){
    this.setData();
    if(this.loadingD != null){
        this.loadingD.close();
    }
    this.interval = setInterval(async()=>{
      await this.setData();
    },10000);

  }

  decodeFormat(tx){
    var result = {
        txid: tx.getId(),
        version: tx.version,
        locktime: tx.locktime,
    };
    return result;
  }

  decodeInput(tx){
      var result = [];


      tx.ins.forEach(function(input, n){
        let pubKeyIn = '';
          let chunksIn = bitcoin.script.decompile(input.script);
          let hash = bitcoin.crypto.hash160(chunksIn[chunksIn.length - 1])
          pubKeyIn = bitcoin.address.toBase58Check(hash, bitcoin.networks.bitcoin.pubKeyHash)
          var vin = {
              txid: input.hash.reverse().toString('hex'),
              n : input.index,
              script: bitcoin.script.toASM(input.script),
              sequence: input.sequence,
              address: pubKeyIn
          }
          result.push(vin);
      })
      return result
  }

  decodeOutput(tx, network){
      var format = function(out, n, network){
          var vout = {
              satoshi: out.value,
              value: (1e-8 * out.value).toFixed(8),
              n: n,
              scriptPubKey: {
                  asm: bitcoin.script.toASM(out.script),
                  hex: out.script.toString('hex'),
                  type: classify.output(out.script),
                  addresses: [],
              },
          };
          switch(vout.scriptPubKey.type){
          case 'pubkeyhash':
          case 'scripthash':
              vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
              break;
          }
          return vout
      }

      var result = [];
      tx.outs.forEach(function(out, n){
          result.push(format(out, n, network));
      })
      return result
  }

  timestampFormats(unix_tm){
    let dt = new Date(parseInt(unix_tm)*1000);
    let date = dt.getDate()+"-"+(dt.getMonth()+1)+"-"+dt.getFullYear();
    let options = { month: 'short' };
    let month = dt.toLocaleDateString("i-default", options);
    let dayOptions = {day: "numeric"};
    let day = dt.toLocaleDateString("i-default", dayOptions);
    let hour = dt.getHours();
    let minutes = dt.getMinutes();
    let  time;
    if(minutes < 10){
      time = hour + ":0" + minutes;
    }else{
      time = hour + ":" + minutes;
    }
    let fullDate;
    var optionsFulldate = {weekday:"long",year:"numeric",month:"long", day:"numeric"};
    let strDate = dt.toLocaleDateString("i-default", optionsFulldate);
    fullDate = strDate + " " + time;

    let countdown = this.moment(dt).fromNow()
    let obj = {
      date: date,
      month: month,
      day: day,
      fullDate: fullDate,
      countdown: countdown
    }

    return obj;
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