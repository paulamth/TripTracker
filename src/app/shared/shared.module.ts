import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; 
import { LeafletMapComponent } from '../components/leaflet-map/leaflet-map.component';
import { AttractionDetailsComponent } from '../components/attraction-details/attraction-details.component';



@NgModule({
  declarations: [ 
    LeafletMapComponent, 
    AttractionDetailsComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    LeafletMapComponent,
    AttractionDetailsComponent
  ]
})

export class SharedModule { }
