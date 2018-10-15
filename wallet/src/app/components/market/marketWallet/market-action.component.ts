import { Component, Input, OnChanges } from '@angular/core'
import { MarketService } from '../../../services/market.service';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';
import BigNumber from 'bignumber.js';
import { RawTx, RawTxIncrementedNonce } from '../../../models/rawtx';
import { AccountService } from '../../../services/account.service';

@Component({
    selector: 'app-action-amounts',
    templateUrl: './market-action.component.html',
})
export class MarketActionComponent implements OnChanges{
    @Input() action: string;
    @Input() token: any;
    @Input() walletAmount: number;
    @Input() deltaAmount: number;
    submited: boolean = false;
    lastAction: string;
    gasLimit:number;
    dialogRef;
    constructor(private _market: MarketService, private _account: AccountService, private sendDialogService: SendDialogService, private _web3: Web3, private _dialog: DialogService) {
        this.lastAction = this.action;
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
                this.sendDialogService.openConfirmSend(tx.tx, this._market.contractEtherDelta.address, tx.amount, tx.gas, tx.cost, "send");
            }
        }
        
    }

    async depositEth(params){
        this.gasLimit= this._market.config.gasDeposit;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'deposit');
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            //let optionsDepositEth = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return new RawTx(this._account, this._market.contractEtherDelta.address, new BigNumber(params[0]), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, data)
            //return await this._rawtx.createRaw(this._market.contractEtherDelta.address, params[0],  optionsDepositEth);
        }
        return null;    
    }

    async withdrawEth(params){
        this.gasLimit= this._market.config.gasWithdraw;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdraw', params);
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            //let optionsWithdraw = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return new RawTx(this._account, this._market.contractEtherDelta.address, new BigNumber(0), gasOpt.gasLimit, gasOpt.gasPrice,this._web3.network, data)
            //this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsWithdraw)
        }
        return null;
    }

    async depositToken(params){
        let dataApprove = this._market.getFunctionData(this._market.token.contract, 'approve', [this._market.contractEtherDelta.address, params[0]]); 
        console.log(dataApprove, this._market.contractEtherDelta.address);
        let gasApprove;
        try{
            gasApprove = await this._web3.estimateGas(this._account.account.address, this._market.contractEtherDelta.address, dataApprove);
        }catch(e){
            gasApprove = 3000000;
        }
        this.gasLimit= gasApprove + this._market.config.gasDeposit;

        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){    
            //let optionsApprove = {data:dataApprove, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            let txApprove =  new RawTx(this._account, this._market.token.addr, new BigNumber(0), gasOpt.gasLimit-this._market.config.gasDeposit, gasOpt.gasPrice,this._web3.network, dataApprove)
            let dataDeposit = this._market.getFunctionData(this._market.contractEtherDelta, 'depositToken', [this._market.token.addr,params[0]]);
            //let optionsDeposit = {data:dataDeposit, nonceIncrement:1, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            let txDeposit = new RawTxIncrementedNonce(this._account, this._market.contractEtherDelta.address, new BigNumber(0), this._market.config.gasDeposit, gasOpt.gasPrice,this._web3.network, dataDeposit, 1);
              //await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsDeposit );
            let tx: any[] = [txApprove.tx, txDeposit.tx];
            let amount = 0;
            let cost = txApprove.cost+ txDeposit.cost;
            let gas = txApprove.gas+ txDeposit.gas;
            
            return {tx:tx, cost:cost, gas:gas, amount:amount};
        }
        return null;
    }

    async withdrawToken(params){
        this.gasLimit= this._market.config.gasWithdraw;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdrawToken', [this._market.token.addr,params[0]]);
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            return  new RawTx(this._account, this._market.contractEtherDelta.address, new BigNumber(0), this._market.config.gasDeposit, gasOpt.gasPrice,this._web3.network, data);
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
