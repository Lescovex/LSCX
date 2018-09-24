export class CustomContract{
    public address: string;
    public name: string;
    public type: string;
    public abi: any;
    public account: string;
    public network: number;

    constructor(address:string, name:string, abi:any, account:string, network:number) {
        this.address = address;
        this.name = name;
        this.type = "custom";
        this.abi = abi;
        this.account = account;
        this.network = network;
        
    }
}