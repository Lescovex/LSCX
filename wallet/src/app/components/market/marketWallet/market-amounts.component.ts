import { Component, Input } from '@angular/core';
import { MarketComponent } from "../market.component";
import { ZeroExService } from "../../../services/0x.service";


@Component({
  selector: 'app-market-amounts',
  templateUrl: './market-amounts.component.html',
})
export class MarketAmountsComponent {
  @Input() token: any;
  @Input() walletAmount: number;
  @Input() deltaAmount: number;
  @Input() accountAmount: number;
  constructor(protected _market:MarketComponent, public _zeroEx: ZeroExService) {
    
  }

  ngOnInit(){
    
  }
  amount(amount){
    return amount/Math.pow(10,this.token.decimals)
  }

  truncateNumber(number){
    let digits = 3;
    let fact= Math.pow(10,digits);   
    return Math.floor(number*fact)/fact;
  }
}
