export class Fund {
    txHash: string;
    kind: string;
    tokenAddr: string;
    amount: number;
    show: boolean;
    nonce: number;

    constructor(kind: string, tokenAddr: string, amount: number, nonce: number) {
        this.kind = kind;
        this.tokenAddr = tokenAddr;
        this.amount = amount;
        this.show = false;
        this.nonce = nonce;
    }
}