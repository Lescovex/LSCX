import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WalletComponent } from './components/wallet/wallet.component'
import { GlobalPage } from './components/wallet/global/global.page'
import { SendPage } from './components/wallet/send/send.page'
import { ReceivePage } from './components/wallet/receive/receive.page'
import { WsettingsPage } from './components/wallet/wsettings/wsettings.page'

import { TokensComponent } from './components/tokens/tokens.component'
import { GeneralPage } from './components/tokens/general/general.page'
import { SendTokensPage } from './components/tokens/send/send-tokens.page'
import { AddTokenPage } from './components/tokens/add/add.page'

import { HoldersComponent } from './components/holders/holders.component';
import { HoldersGeneralPage } from './components/holders/general/general.page';

import { ContractsComponent } from './components/contracts/contracts.component'
import { AddContractPage } from './components/contracts/add/add-contract.component'
import { SelectContractPage } from './components/contracts/contracts/selectContract.component'
import { HistoryPage } from './components/contracts/history/history.page'

import { MarketComponent } from './components/market/market.component'
import { MarketWalletPage } from './components/market/marketWallet/market-wallet.page';
import { BuySellPage } from './components/market/buySell/buy-sell.page';
import { MarketHistoryPage } from './components/market/history/market-history.page';

import { SettingsComponent } from './components/settings/settings.component'

const routes: Routes = [
  { path: 'wallet', component: WalletComponent,
    children: [
      { path: '', redirectTo: 'global', pathMatch: 'full' },
      { path: 'global', component: GlobalPage },
      { path: 'send', component: SendPage },
      { path: 'receive', component: ReceivePage },
      { path: 'wsettings', component: WsettingsPage }
    ]
  },
  { path: 'tokens', component: TokensComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: GeneralPage },
      { path: 'send-tokens', component: SendTokensPage },
      { path: 'add', component: AddTokenPage },
    ]
  },
  { path: 'holders', component: HoldersComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: HoldersGeneralPage }
    ]
  },
  { path: 'contracts', component: ContractsComponent,
    children: [
      { path: '', redirectTo: 'contract-page', pathMatch: 'full' },
      { path: 'add', component: AddContractPage },
      { path: 'contract-page', component: SelectContractPage },
      { path: 'history', component: HistoryPage }
    ]
  },
  { path: 'market', component: MarketComponent,
    children: [
      { path: '', redirectTo: 'history', pathMatch: 'full' },
      { path: 'buy-sell', component: BuySellPage },
      { path: 'market-wallet', component: MarketWalletPage },
      { path: 'history', component: MarketHistoryPage }
    ]
  },
  { path: 'general-settings', component: SettingsComponent },
  { path: '', redirectTo: '/market', pathMatch: 'full' },
  { path: '**', redirectTo: '/market', pathMatch: 'full' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes)],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
