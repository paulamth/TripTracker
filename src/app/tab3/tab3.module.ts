import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';

import { Tab3PageRoutingModule } from './tab3-routing.module';
import { AddTripModalComponent } from '../components/add-trip-modal/add-trip-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab3PageRoutingModule,
  ],
  declarations: [
    Tab3Page,
    AddTripModalComponent,
  ]
})
export class Tab3PageModule {
  

}
