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

        let dialogRef = this._dialog.openLoadingDialog(); 
        let params = [];
        let tx;
        let value = 0;
        if(this.action != 'deposit' && this.token.name == 'ETH') {
            value = parseInt(this._web3.web3.toWei(form.controls.amount.value, 'ether'));
        } else if(this.token.name != 'ETH') {
            value = parseInt(form.controls.amount.value)*Math.pow(10,this.token.decimals);
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
                console.log('withTk', form);
                tx = await this.withdrawToken(params);
                break;
        }
        dialogRef.close();
        if(tx instanceof Error) {
            this._dialog.openErrorDialog("Unable to "+this.action, "You don't have enough founds", " ");
        } else {
            this.sendDialogService.openConfirmSend(tx[0], this._market.contractEtherDelta.address, tx[2],tx[1]-tx[2], tx[1], "send");
        }
        
    }

    async depositEth(params){
            let data = this._market.getFunctionData(this._market.contractEtherDelta, 'deposit');
            return await this._rawtx.createRaw(this._market.contractEtherDelta.address, params[0], {data:data}) ;           
    }

    async withdrawEth(params){
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdraw', params);
        return  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , {data:data})
    }

    async depositToken(params){
        let dataApprove = this._market.getFunctionData(this._market.token.contract, 'approve', [this._market.contractEtherDelta.address, params[0]]);
        let optionsApprove = {data:dataApprove, gasLimit: this._market.config.gasApprove}
        let txApprove =  await this._rawtx.createRaw(this._market.token.addr, 0 , optionsApprove)
        let dataDeposit = this._market.getFunctionData(this._market.contractEtherDelta, 'depositToken', [this._market.token.addr,params[0]]);
        let optionsDeposit = {data:dataDeposit, nonce:1, gasLimit: this._market.config.gasDeposit}
        let txDeposit =  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , optionsDeposit );
        let tx: any[] = [txApprove[0], txDeposit[0]];
        let amount = txApprove[2]+ txDeposit[2];
        let cost = txApprove[1]+ txDeposit[1];
        
        return [tx, cost, amount];
    }

    async withdrawToken(params){
        let data = this._market.getFunctionData(this._market.contractEtherDelta, 'withdrawToken', [this._market.token.addr,params[0]]);
        return  await this._rawtx.createRaw(this._market.contractEtherDelta.address, 0 , {data:data})
    }
}
