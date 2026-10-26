import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { OpentripmapService } from 'src/app/services/opentripmap.service';

@Component({
  selector: 'app-attraction-details',
  templateUrl: './attraction-details.component.html',
  styleUrls: ['./attraction-details.component.scss'],
})
export class AttractionDetailsComponent implements OnInit, OnChanges {

  @Input() placeId: string = '';
  attractionDetails: any = {};

  constructor(
    private openTripMapService: OpentripmapService
  ) { }

  ngOnInit() {
    this.loadAttractiondetails(this.placeId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['placeId'] && changes['placeId'].currentValue !== changes['placeId'].previousValue) {
      this.loadAttractiondetails(changes['placeId'].currentValue);
    }
  }

  async loadAttractiondetails(placeId: string){
  (await this.openTripMapService.getPlaceDetails(placeId)).subscribe(
    (data: any) => {
      if (Array.isArray(data)) {
        this.attractionDetails = data[0]; 
      } else {
        this.attractionDetails = data;
      }
    },
    (error: any) => {
      console.error('Fehler beim Abrufen der Ortsdetails:', error);
    }
  );
  }

}
