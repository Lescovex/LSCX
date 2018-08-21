import { Component, OnInit } from '@angular/core';

import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
})
export class TokensComponent implements OnInit {

  constructor(public _account:AccountService) {
  }
  ngOnInit() {
  }
}
