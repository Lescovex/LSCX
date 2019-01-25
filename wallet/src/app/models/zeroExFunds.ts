export class ZeroExFunds {
    
    type: string;
    amount: number;
    date: Date;

    constructor(type: string, amount: number) {
        this.type = type;
        this.amount = amount;
        this.date = new Date();
    }
}