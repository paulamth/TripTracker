import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Tab1PageRoutingModule } from './tab1-routing.module';
import { SavePlaceModalComponent } from '../components/save-place-modal/save-place-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab1PageRoutingModule
  ],
  declarations: [SavePlaceModalComponent]

})
export class Tab1PageModule {}
