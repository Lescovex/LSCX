import { Component, Input, OnChanges } from '@angular/core'
import { MarketService } from '../../../services/market.service';
import { RawTxService } from '../../../services/rawtx.sesrvice';
import { SendDialogService } from '../../../services/send-dialog.service';
import { Web3 } from '../../../services/web3.service';
import { DialogService } from '../../../services/dialog.service';

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
    constructor(private _market: MarketService, private _rawtx: RawTxService, private sendDialogService: SendDialogService, private _web3: Web3, private _dialog: DialogService) {
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
        let gasLimit =
        console.log(this.token.name)
        console.log("form", form.controls)
        if(this.action != 'deposit' && this.token.name == 'ETH') {
            value = parseInt(this._web3.web3.toWei(form.controls.amount.value, 'ether'));
        } else if(this.token.name != 'ETH') {
            value = parseFloat(form.controls.amount.value)*Math.pow(10,this.token.decimals);
          console.log("value",value)
        } else {
            value = form.controls.amount.value;
        }
        params.push(value);

        switch(true){
            case (this.action == "deposit" && this.token.name == "ETH"):
                tx = await this.depositEth(params);
                break;
            case (this.action == "deposit" && this.token.name != "ETH"):
                console.log('depTk')
                tx = await this.depositToken(params);
                break;
            case (this.action == "withdraw" && this.token.name == "ETH"): 
                tx = await this.withdrawEth(params);
                break;
            case (this.action == "withdraw" && this.token.name != "ETH"):
                //console.log('withTk', form);
                tx = await this.withdrawToken(params);
                break;
        }

        if(tx instanceof Error) {
            this._dialog.openErrorDialog("Unable to "+this.action, "You don't have enough founds", " ");
        } else {
            if(tx != null){
                this.sendDialogService.openConfirmSend(tx[0], this._market.contractEtherDelta.address, tx[2],tx[1]-tx[2], tx[1], "send");
            }
        }
        
    }

    async depositEth(params){
        this.gasLimit= this._market.config.gasDeposit;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'deposit');
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            let optionsDepositEth = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return await this._rawtx.createRaw(this._market.contractEtherDelta.address, params[0],  optionsDepositEth);
        }
        return null;    
    }

    async withdrawEth(params){
        this.gasLimit= this._market.config.gasWithdraw;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdraw', params);
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            let optionsWithdraw = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsWithdraw)
        }
        return null;
    }

    async depositToken(params){
        this.gasLimit= this._market.config.gasDeposit;
        let dataApprove = this._market.getFunctionData(this._market.token.contract, 'approve', [this._market.contractEtherDelta.address, params[0]]);
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            let optionsApprove = {data:dataApprove, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            let txApprove =  await this._rawtx.createRaw(this._market.token.addr, 0 , optionsApprove)
            let dataDeposit = this._market.getFunctionData(this._market.contractEtherDelta, 'depositToken', [this._market.token.addr,params[0]]);
            let optionsDeposit = {data:dataDeposit, nonce:1, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            let txDeposit =  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsDeposit );
            let tx: any[] = [txApprove[0], txDeposit[0]];
            let amount = txApprove[2]+ txDeposit[2];
            let cost = txApprove[1]+ txDeposit[1];
            
            return [tx, cost, amount];
        }
        return null;
    }

    async withdrawToken(params){
        this.gasLimit= this._market.config.gasWithdraw;
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdrawToken', [this._market.token.addr,params[0]]);
        let gasOpt = await this.openGasDialog();
        if(gasOpt!=null){
            let optionsWithdraw = {data:data, gasLimit: gasOpt.gasLimit, gasPrice: gasOpt.gasPrice};
            return  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsWithdraw)
        }
        return null;
    }

    async openGasDialog(){
        this.dialogRef.close();
        let dialogRef = this._dialog.openGasDialog(this.gasLimit, 1);
        let result = await dialogRef.afterClosed().toPromise();
        console.log(result);
        if(typeof(result) != 'undefined'){
            let obj = JSON.parse(result);
            return obj;
        }
        return null;
    }
}
