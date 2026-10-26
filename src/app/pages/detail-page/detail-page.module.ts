import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetailPagePageRoutingModule } from './detail-page-routing.module';
import { DetailPagePage } from './detail-page.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetailPagePageRoutingModule,
    SharedModule
  ],
  declarations: [DetailPagePage]
})
export class DetailPagePageModule {}
