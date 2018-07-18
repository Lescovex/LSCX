import { Component, OnInit, OnDestroy } from '@angular/core'

/*Services*/
import { AccountService } from '../../../account.service'


@Component({
  selector: 'general-page',
  templateUrl: './general.html'
})

export class GeneralPage implements OnInit {

  interval;
  constructor(protected _account: AccountService) {
    // console.log('SendPage')
  }

  ngOnInit() {
    this.interval=this._account.startIntervalTokens();
  }
  ngOnDestroy(){
    clearInterval(this.interval)
  }
}