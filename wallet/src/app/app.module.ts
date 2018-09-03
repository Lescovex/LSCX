
import { NgModule, CUSTOM_ELEMENTS_SCHEMA }  from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Http, HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { MdInputModule, MdCheckboxModule, MdSidenavModule } from '@angular/material';
import { MdCardModule, MdButtonModule, MD_DIALOG_DATA} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdDialogModule } from '@angular/material';



/*Routes*/
import { AppRoutingModule } from './app.routes';


/*Components*/
import { MyApp } from './app.component';
import { NavComponent } from './components/navComponent/nav.component'

import { PaginatorComponent } from './components/paginator/paginator.component'

import { WalletComponent } from './components/wallet/wallet.component'
import { GlobalPage } from './components/wallet/global/global.page'
import { SendPage } from './components/wallet/send/send.page'
import { ReceivePage } from './components/wallet/receive/receive.page'
import { ListComponent } from './components/wallet/global/list.component'
import { WsettingsPage } from './components/wallet/wsettings/wsettings.page'

import { TokensComponent } from './components/tokens/tokens.component'
import { GeneralPage } from './components/tokens/general/general.page'
import { SendTokensPage } from './components/tokens/send/send-tokens.page'
import { AddTokenPage } from './components/tokens/add/add.page'

import { ContractsComponent } from './components/contracts/contracts.component'
import { AddContractPage } from './components/contracts/add/add-contract.component'
import { SelectContractPage } from './components/contracts/contracts/selectContract.component'
import { ShowContract } from './components/contracts/contracts/showContract.component'
import { HistoryPage } from './components/contracts/history/history.page'

import { MarketComponent } from './components/market/market.component'

import { SettingsComponent } from './components/settings/settings.component'

/*Dialogs*/
import { SelectAccountDialogComponent } from './components/navComponent/selectAccount-dialog.component';
import { AddAccountDialogComponent } from './components/navComponent/addAccount-dialog.component';
import { NewAccountDialogComponent } from './components/navComponent/newAccount-dialog.component';
import { ImportAccountDialogComponent } from './components/navComponent/importAccount-dialog.component';
import { SendDialogComponent } from './components/dialogs/send-dialog.component';
import { DeleteComponent } from './components/wallet/wsettings/confirm-delete.component';
import { JSONDialogComponent } from './components/wallet/wsettings/json-dialog.component';
import { PrivateKeyDialogComponent } from './components/wallet/wsettings/privatekey-dialog.component'
import { ErrorDialogComponent } from './components/dialogs/error-dialog.component';
import { LoadingDialogComponent } from './components/dialogs/loading-dialog.component';
import { MessageDialogComponent } from './components/dialogs/message-dialog.component';


/*Servicies*/
import { WalletService } from './services/wallet.service';
import { AccountService } from './services/account.service';
import { Web3 } from './services/web3.service';
import { DialogService } from './services/dialog.service';
import { SendDialogService } from './services/send-dialog.service';
import { TokenService } from './services/token.service';
import { ContractService } from './services/contract.service'
import { FormsService } from './services/forms.service'
import { RawTxService } from './services/rawtx.sesrvice'
import { ContractStorageService } from './services/contractStorage.service'
import { EtherscanService } from './services/etherscan.service'

/*Pipes*/
import { ConverterPipe } from './pipes/converter.pipe';
import { SeparateWordsPipe } from './pipes/words.pipe'



@NgModule({
  declarations: [
    MyApp,
    NavComponent,
    WalletComponent,
    GlobalPage,
    SendPage,
    ReceivePage,
    WsettingsPage,
    SettingsComponent,
    ConverterPipe,
    SeparateWordsPipe,
    SelectAccountDialogComponent,
    AddAccountDialogComponent,
    NewAccountDialogComponent,
    ImportAccountDialogComponent,
    SendDialogComponent,
    DeleteComponent,
    ErrorDialogComponent,
    LoadingDialogComponent,
    JSONDialogComponent,
    PrivateKeyDialogComponent,
    ListComponent,
    PaginatorComponent,
    TokensComponent,
    GeneralPage,
    SendTokensPage,
    AddTokenPage,
    ContractsComponent,
    AddContractPage,
    SelectContractPage,
    ShowContract,
    HistoryPage,
    MarketComponent,
    MessageDialogComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    MaterialModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MdSidenavModule,
    MdDialogModule,
    MdCardModule,
    MdButtonModule,
    MdInputModule,
    AppRoutingModule,
  ],
  exports: [
    MaterialModule,
    BrowserAnimationsModule,
  ],
  bootstrap: [MyApp],
  entryComponents: [
    MyApp,
    SelectAccountDialogComponent,
    AddAccountDialogComponent,
    NewAccountDialogComponent,
    ImportAccountDialogComponent,
    SendDialogComponent,
    DeleteComponent,
    ErrorDialogComponent,
    LoadingDialogComponent,
    JSONDialogComponent,
    PrivateKeyDialogComponent,
    MessageDialogComponent
  ],
  providers: [
    WalletService,
    AccountService,
    Web3,
    DialogService,
    SendDialogService,
    TokenService,
    ContractService,
    FormsService,
    RawTxService,
    ContractStorageService,
    EtherscanService
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
