import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TripOverviewPage } from './trip-overview.page';

const routes: Routes = [
  {
    path: '',
    component: TripOverviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TripOverviewPageRoutingModule {}
