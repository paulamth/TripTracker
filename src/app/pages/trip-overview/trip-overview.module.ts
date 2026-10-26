import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TripOverviewPageRoutingModule } from './trip-overview-routing.module';

import { TripOverviewPage } from './trip-overview.page';
import { TripSettingsModalComponent } from 'src/app/components/trip-settings-modal/trip-settings-modal.component';
import { AddDateToPlaceModalComponent } from 'src/app/components/add-date-to-place-modal/add-date-to-place-modal.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TripOverviewPageRoutingModule,
    SharedModule
  ],
  declarations: [TripOverviewPage, TripSettingsModalComponent, AddDateToPlaceModalComponent]
})
export class TripOverviewPageModule {}
