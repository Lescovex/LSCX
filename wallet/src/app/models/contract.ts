export class Contract {
    public address: String;
    public type: String;
    public deployHash: String;
    public name: string;
    public decimals: string;
    public symbol: string;
    public totalSupply: number;
    public active: boolean;
    public account: string;

    constructor(){
        this.active = false;
    }
    
    deployContract(hash, info, type, account){
        this.deployHash = hash;
        this.name = info.name;
        this.symbol = info.symbol;
        this.totalSupply = info.totalSupply;
        this.type = type;
        this.account = account;
    }
    
    importContract(address, hash, type, account, info){
        this.address = address;
        this.deployHash = hash;
        this.type = type;
        this.account = account;
        this.active = true;
        this.name = info.name;
        this.symbol = info.symbol;
        this.totalSupply = info.totalSupply;
    }
}