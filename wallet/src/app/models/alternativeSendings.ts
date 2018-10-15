import { AlternativeSending } from "./alternativeSending";

export class AlternativeSendings {
    private _sendings: AlternativeSending[];

    constructor(){
        this._sendings = [];
    }

    getFromLocalStorage(address, network){
        if(localStorage.getItem('alternativeSendings')){
            let savedSendings: any = JSON.parse(localStorage.getItem('alternativeSendings'));
            if(address in savedSendings)  {
                let sendings = savedSendings.filter(sending=> sending.network == network);
                sendings.map(x=> {
                    let timeStamp = x.timeStamp;
                    let recover = x.recover;
                    x= new AlternativeSending(x.seed,x.to, x.frm, x.hash, x.amount, x.network);
                    x.timeStamp = timeStamp;
                    x.recover = recover;
                })
            }
        }
    }

    saveToLocalStorage(address){
        let savedSendings: any ={}
        if(localStorage.getItem('alternativeSendings')){
            let savedSendings: any = JSON.parse(localStorage.getItem('alternativeSendings'));
        }
        savedSendings.address = this._sendings;

        localStorage.setItem('alternativeSendings', JSON.stringify(savedSendings));
    }

    checkforTimestamp(accountsTx){
        this._sendings.forEach(x=>{
            if(x.timeStamp == null){
                x.checkTimeStamp(accountsTx);
            }
            if(x.timeStamp != null){
                x.checkRecover();
                x.isReceived();
            }
        })
    }
}