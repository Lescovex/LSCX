import { Component, OnInit } from '@angular/core'
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/*Services*/
import { AccountService } from '../../services/account.service';

/*Dialog*/
import {MdDialog} from '@angular/material';
import { SelectAccountDialogComponent } from './selectAccount-dialog.component';
import { AddAccountDialogComponent } from './addAccount-dialog.component';
import { LoadingDialogComponent } from '../dialogs/loading-dialog.component';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  route: string = "";
  loadingD;
  interval
  constructor(location: Location, router: Router,public _account: AccountService,public dialog: MdDialog) {
    router.events.subscribe((val) => {
      if(location.path() != ''){
        this.route = location.path();
      }
    });
    this.loadingD=this.dialog.open(LoadingDialogComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });

    this.interval = setInterval(()=>{
      if('balance' in this._account.account){
        this.loadingD.close();
        clearInterval(this.interval);
      }
    })
    if(!('address' in this._account.account)){
      this.loadingD.close();
     // this.loadingDialog();
    }
  }

  ngOnInit() {
    //console.log(this.route)
  }
  
  openAddAccount() {
    let dialogRef = this.dialog.open(AddAccountDialogComponent, {
      width: '660px',
      height: '155px',
      panelClass: 'dialog'
    });
  }

  openSelectAccount(){
    let self= this;
    let dialogRef = this.dialog.open(SelectAccountDialogComponent, {
      width: '660px',
      height: '400px',
      panelClass: 'dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result == 'loading'){
        self.loadingDialog()
      }
    });

  }

  loadingDialog(){
    let dialogRef=this.dialog.open(LoadingDialogComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });

    let loading = setInterval(()=>{
      if('balance' in this._account.account){
        dialogRef.close();
        clearInterval(loading);
      }
    })
  }

}
