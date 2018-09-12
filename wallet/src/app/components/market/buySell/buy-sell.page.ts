import { Component, OnInit } from '@angular/core'

import { AccountService } from '../../../services/account.service';

import { MarketService } from '../../../services/market.service';
import { DialogService } from '../../../services/dialog.service';
import { Web3 } from '../../../services/web3.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { BigNumber } from 'bignumber.js';

const EthAbi = require('ethereumjs-abi');

@Component({
    selector: 'app-buy-sell',
    templateUrl: './buy-sell.page.html',
})
export class BuySellPage implements OnInit {
    protected action: string;
    f: any = {
      amount : undefined,
      price : undefined,
      total: 0,
      expires : 10000
    }
    protected buyInCross: string;
    protected submited: boolean = false;
    private interval;

    constructor(public _account:AccountService, private _market: MarketService, private _dialog: DialogService,private  sendDialogService: SendDialogService, private _web3: Web3, private _rawtx : RawTxService) {
        this.action = "buy";
    }

    async ngOnInit() {
      this.interval = await this._market.balancesInterval();
      this._market.waitForMarket();
    }

    ngOnDestroy() {
      clearInterval(this.interval)
    }

    async onSubmit(form) {
      
      this.submited = true;
      if(form.invalid) return false;
      
      let tokenAmount = this.f.amount*Math.pow(10,this._market.token.decimals);
      let ethAmount = Math.floor(this.f.total*Math.pow(10,18));
  
      let ethAddr =  this._market.config.tokens[0].addr;
      //let nonce = 481;
      let nonce = await this._web3.getNonce(this._account.account.address);
      let params: any[];

      if(this.action == "buy" && this.f.total <= this._market.etherdeltaBalances.eth){
        params = [this._market.token.addr, tokenAmount, ethAddr, ethAmount, this.f.expires, nonce]
      } else if (this.action == "sell" && this.f.amount <= this._market.etherdeltaBalances.token){
        params = [ethAddr, ethAmount, this._market.token.addr, tokenAmount, this.f.expires, nonce]
      }else{
        let dialogRef = this._dialog.openErrorDialog('Unable to send this order', "You don't have enough funds. Please DEPOSIT first using the Deposit form in the market wallet tab. Enter the amount you want to deposit and press the 'Deposit' button.", " ")
        return false
      }
      
      let hashParams : any[]= [this._market.contractEtherDelta.address].concat(params);
      console.log(hashParams);
      /*let hash =  EthAbi.soliditySHA256(
        [ "address", "address", "uint256", "address", "uint256", "uint256", "uint256" ],
        hashParams
      ).toString('hex');*/
      console.log(EthAbi.soliditySHA256( ["address"], [this._market.config.contractEtherDeltaAddrs[0].addr]).toString('hex')) 
      console.log(EthAbi.soliditySHA256( ["uint256"], [tokenAmount]).toString('hex'))
      console.log(EthAbi.soliditySHA256( ["address","uint256"], [this._market.contractEtherDelta.address, tokenAmount]).toString('hex')) 

      let data =  await this._market.getFunctionData(this._market.contractEtherDelta,'order',params);
      let tx = await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0, {data:data, gasLimit: this._market.config.gasOrder })
      if(tx instanceof Error) {

      } else {
          this.sendDialogService.openConfirmSend(tx[0], this._market.contractEtherDelta.address, tx[2],tx[1]-tx[2], tx[1], "send");
      }
      //0xa04e4e1bdb8c415394dee2d74a2824c1783af8a4e69576150699af84ebfe6f64  

    }

    activeButton(action) {
      this.action = action;
    }

    total() {
      let total = this.f.amount * this.f.price;
      this.f.total = (isNaN(total))? 0 : total
    }

    setInCross() {
      if(this.f.total != 0 && this._market.state.orders && this._market.state.orders.sells && this._market.state.orders.sells.length > 0) {
        var bestSell = this._market.state.orders.sells[0].price;
        this.buyInCross = (this.f.price !== 0 && this.f.price > 1.5 * bestSell) ? "Your order is in cross with the best sell order in the order book (price = " + bestSell + ")." : "";
      }
    }

}
