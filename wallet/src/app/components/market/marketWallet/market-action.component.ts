import { Component, Input, OnChanges } from '@angular/core'
import { LSCXMarketService } from '../../../services/LSCX-market.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';
import { ZeroExService } from "../../../services/0x.service";
import BigNumber from 'bignumber.js';
import { RawTx, RawTxIncrementedNonce } from '../../../models/rawtx';
import { Fund } from '../../../models/fund';
import { AccountService } from '../../../services/account.service';

import { EtherscanService } from '../../../services/etherscan.service';
import { ContractService } from '../../../services/contract.service';
import { MdDialog } from '@angular/material';

import { LoadingDialogComponent } from '../../dialogs/loading-dialog.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog.component';

@Component({
    selector: 'app-action-amounts',
    templateUrl: './market-action.component.html',
})
export class MarketActionComponent implements OnChanges{
    @Input() action: string;
    @Input() token: any;
    @Input() walletAmount: number;
    @Input() deltaAmount: number;
    @Input() actionName: string;

    submited: boolean = false;
    lastAction: string;
    gasLimit:number;
    dialogRef;
    loadingD;
    constructor(public _zeroEx: ZeroExService, public _LSCXmarket: LSCXMarketService, private _account: AccountService, private sendDialogService: SendDialogService, private _web3: Web3, private _dialog: DialogService,  private _scan: EtherscanService, private _contract: ContractService, public dialog: MdDialog) {
        this.lastAction = this.action;
    }

    ngOnInit(){
    }
    ngOnChanges(): void{
        if(this.lastAction != this.action){
            this.submited = false;
            this.lastAction = this.action;
        }
    }

    async onSubmit(form){
        this.submited = true;
        if(form.invalid){
            return false
        }
        if(this._zeroEx.display == "eth"){
            this.dialogRef = this._dialog.openLoadingDialog(); 
            let params = [];
            let tx;
            let value = 0;
            
            if(this.token.name == 'ETH') {
                value = parseInt(this._web3.web3.toWei(form.controls.amount.value, 'ether'));
            } else if(this.token.name != 'ETH') {
                value = parseFloat(form.controls.amount.value)*Math.pow(10,this.token.decimals);
            }
            
            params.push(value);

            switch(true){
                case (this.action == "deposit" && this.token.name == "ETH"):
                    tx = await this.depositEth(params);
                    break;
                case (this.action == "deposit" && this.token.name != "ETH"):
                    tx = await this.depositToken(params);
                    break;
                case (this.action == "withdraw" && this.token.name == "ETH"): 
                    tx = await this.withdrawEth(params);
                    break;
                case (this.action == "withdraw" && this.token.name != "ETH"):
                    tx = await this.withdrawToken(params);
                    break;
            }        
            
            if(tx instanceof Error == true) {
                this._dialog.openErrorDialog("Unable to "+this.action, "You don't have enough founds", " ");
            } else {
                if(tx != null){
                    let nonce;
                    if(this.action == "deposit" && this.token.name != "ETH"){
                        nonce = tx.nonce;
                    }else{
                        await tx.setTxNonce(this._account);
                        nonce = await tx.getNonce();
                    }
                    let functionObj = new Fund(this.action, this.token.addr, form.controls.amount.value, nonce);             
                    this.sendDialogService.openConfirmMarketFunds(tx.tx, this._LSCXmarket.contractMarket.address, tx.amount, tx.gas, tx.cost, "send", "myFunds",functionObj);
                    
                }
            }
        }

        if(this.action == "deposit" && this._zeroEx.display == "weth" && this.actionName == 'deposit'){
            this.dialogRef = this._dialog.openWethDialog(form.controls.amount.value, "wrap");
            this.dialogRef.afterClosed().subscribe(async result=>{
                let res = JSON.parse(result);
                if(result != null){
                    this.dialogRef = this._dialog.openLoadingDialog();
                    await this._zeroEx.setProvider(res.key)
                    await this._zeroEx.depositWETH(form.controls.amount.value);
                    await this._zeroEx.setUnlimitedProxyAllowance(this.token.tokenAddress, this._account.account.address);
                    await this._zeroEx.updateAllowance();
                    this.dialogRef.close();
                }
            });
        }
        if(this.action == "deposit" && this._zeroEx.display == "weth" && this.actionName == 'override allowance'){
            this.loadingD = this.dialog.open(LoadingDialogComponent, {
                width: '660px',
                height: '150px',
                disableClose: true,
              });
            let resultabi;
            let abi;
            try {
              resultabi = await this._scan.getAbi(this.token.tokenAddress);
            } catch (error) { 
            }
            if(resultabi.result == 'Contract source code not verified'){
              abi = require('human-standard-token-abi');
            }else{
              abi = JSON.parse(resultabi.result)
            }
            let contract = this._contract.contractInstance(abi, this.token.tokenAddress);
            let txData = this.setApprove(contract, this._zeroEx.contractAddresses.erc20Proxy, 0);
            let gasPrice = 10000000000;
            let gasLimit;

            try{
            gasLimit = await this._web3.estimateGas(this._account.account.address, this.token.tokenAddress, txData);
            }catch(e){
            gasLimit = 1000000;
            }

            this.loadingD.close();
            let dialogRef = this._dialog.openGasDialog(gasLimit, gasPrice);
            let result = await dialogRef.afterClosed().toPromise();
            
            let options:any = null;
            if(typeof(result) != 'undefined'){
                options = JSON.parse(result);

            }
            if(options!=null){
            let tx =   new RawTx  (this._account,this.token.tokenAddress,new BigNumber(0),options.gasLimit, options.gasPrice, this._web3.network, txData);
            this.sendDialogService.openConfirmSend(tx.tx, this.token.tokenAddress, 0, tx.gas, tx.cost,'approve');
            
            }
        }
        
        if(this.action == "deposit" && this._zeroEx.display == "weth" && this.actionName == 'allow'){
            //
            let confirmDialog = this.dialog.open(ConfirmDialogComponent, {
                width: '660px',
                height: '300px',
                disableClose: true,
              });
            confirmDialog.afterClosed().subscribe(async result=>{
                if(result != null){
                    this.dialogRef = this._dialog.openLoadingDialog();
                    await this._zeroEx.setProvider(result)
                    await this._zeroEx.setUnlimitedProxyAllowance(this.token.tokenAddress, this._account.account.address);
                    await this._zeroEx.updateAllowance();
                    this.dialogRef.close();
                }
            });
            
        }
        if(this.action == "withdraw" && this._zeroEx.display == "weth"){
            this.dialogRef = this._dialog.openWethDialog(form.controls.amount.value, "unwrap");
            this.dialogRef.afterClosed().subscribe(async result=>{
                let res = JSON.parse(result)
                if(result != null){
                    this.dialogRef = this._dialog.openLoadingDialog();
                    await this._zeroEx.setProvider(res.key);
                    await this._zeroEx.withdrawWETH(form.controls.amount.value);
                    this.dialogRef.close();
                }
            });
        }
    }
    setApprove(contract,to, value):string{
        let txData = contract.approve.getData(to, value);
        return txData
      }
    async depositEth(params){
        let data = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket, 'deposit');
        let gasApprove;
        try{
            gasApprove = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data, params[0]);
        }catch(e){
            console.log(e);
            gasApprove = 3000000;
        }
        this.gasLimit= gasApprove;

        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){    
            return new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(params[0]), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, data);
        }
        return null;    
    }

    async withdrawEth(params){
        //this.gasLimit= this._LSCXmarket.config.gasWithdraw;
        let data = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket, 'withdraw', params);
        let gasApprove;
        try{
            gasApprove = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data);
        }catch(e){
            console.log(e);
            gasApprove = 3000000;
        }
        this.gasLimit= gasApprove;

        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            //let optionsWithdraw = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, data)
            //this._rawtx.createRaw(this._LSCXmarket.contractMarket.address, 0 , optionsWithdraw)
        }
        return null;
    }

    async depositToken(params){
        let dataApprove = this._LSCXmarket.token.contract.approve.getData(this._LSCXmarket.contractMarket.address, params[0]);

        let gasApprove;
        try{
            gasApprove = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.token.contract.address, dataApprove);
        }catch(e){
            console.log(e);
            gasApprove = 3000000;
        }
        this.gasLimit= gasApprove + this._LSCXmarket.config.gasDeposit;

        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){    
            
            let txApprove =  new RawTx(this._account, this._LSCXmarket.token.addr, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, dataApprove)
            let dataDeposit = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket, 'depositToken', [this._LSCXmarket.token.addr,params[0]]);
            
            let txDeposit = new RawTxIncrementedNonce(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, dataDeposit, 1);
            await txDeposit.setIncrementedNonce(this._account,1);
            
            let tx: any[] = [txApprove.tx, txDeposit.tx];
            let amount = 0;
            let cost = txApprove.cost+ txDeposit.cost;
            let gas = txApprove.gas+ txDeposit.gas;
            
            return {tx:tx, cost:cost, gas:gas, amount:amount, nonce: await txDeposit.getNonce()};
        }
        return null;
    }

    async withdrawToken(params){
        let data = this._LSCXmarket.getFunctionData(this._LSCXmarket.contractMarket, 'withdrawToken', [this._LSCXmarket.token.addr,params[0]]);

        let gasApprove;
        try{
            gasApprove = await this._web3.estimateGas(this._account.account.address, this._LSCXmarket.contractMarket.address, data);
        }catch(e){
            console.log(e);
            gasApprove = 3000000;
        }
        this.gasLimit= gasApprove;

        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            return  new RawTx(this._account, this._LSCXmarket.contractMarket.address, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, data);
        }
        return null;
    }

    async openGasDialog(){
        this.dialogRef.close();
        let dialogRef = this._dialog.openGasDialog(this.gasLimit, 1);
        let result = await dialogRef.afterClosed().toPromise();
        
        if(typeof(result) != 'undefined'){
            let obj = JSON.parse(result);
            return obj;
        }
        return null;
    }
}
