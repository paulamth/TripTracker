import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Trip } from 'src/app/model/trip.interface';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-add-date-to-place-modal',
  templateUrl: './add-date-to-place-modal.component.html',
  styleUrls: ['./add-date-to-place-modal.component.scss'],
})
export class AddDateToPlaceModalComponent  implements OnInit {

  places: any[] = [];
  @Input() trip: Trip | undefined;
  @Input() date: string = '';

  constructor(
    private firestoreService: FirestoreService,
    private modalController: ModalController)
     { }

  async ngOnInit() {
    this.places = await this.firestoreService.getAvailablePlacesForDate(this.trip!, this.date);
    this.places.forEach(place => {
      place.selected = false;
    });
  }

  async isPlaceForDateInTrip(placeId: string, pTrip: Trip, date: string): Promise<boolean> {
    const placeUsedIn = await this.firestoreService.getPlaceUsedIn(placeId);
    if (placeUsedIn.trips) {
      const trip = placeUsedIn.trips.find(t => t.tripName === pTrip.name);
      return trip?.plannedDates?.includes(date) || false;
    }
  return false;
  }
  
  async save() {
    const selectedPlaces = this.places.filter(place => place.selected);
    selectedPlaces.forEach(async place => {
      await this.firestoreService.addDateToPlaceForTrip(place, this.trip!, this.date);
    });
    this.modalController.dismiss({
      updated: true
    });
  }
  

  close() {
    this.modalController.dismiss({
      updated: false
    });
  }
}

