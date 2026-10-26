import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/model/place.interface';
import { FirestoreService } from 'src/app/services/firestore.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-add-to-trip',
  templateUrl: './add-to-trip.component.html',
  styleUrls: ['./add-to-trip.component.scss'],
})
export class AddToTripComponent  implements OnInit {

  trips: any[] = [];
  existingTripNames: string[] = [];
  selectedItems: any[] = [];

  @Input() place!: Place;

  constructor(
    private firestoreService: FirestoreService, 
    private modalController: ModalController,
    private localStorageService: LocalStorageService) 
    {}

  async ngOnInit() {
    const allTrips = await this.firestoreService.getTrips();
     this.existingTripNames = await this.firestoreService.getPlaceTrips(this.place.id);
     this.trips = allTrips.filter(trip => !this.existingTripNames.includes(trip.name));
  }

  toggleSelection(trip: any) {
    const index = this.selectedItems.findIndex(item => item.type === 'trip' && item.data.id === trip.id);
  
    if (index > -1) {
      this.selectedItems.splice(index, 1); // Entferne den Trip, wenn bereits ausgewählt
    } else {
      this.selectedItems.push({ type: 'trip', data: trip }); 
    }
  }
 
  
  async save() {
    try {
      for (const item of this.selectedItems) {
        if (item.type === 'trip') {
          const tripName = item.data.name;
          await this.firestoreService.updatePlaceUsedIn(this.place, tripName);
        } 
      }
  
      const lastAddedItem = this.selectedItems[this.selectedItems.length - 1];
      this.localStorageService.setItem('lastAddedItem', lastAddedItem);
      this.modalController.dismiss(this.selectedItems);
    } catch (error) {
      console.error('Fehler beim Speichern aufgetreten:', error);
    }
  }
  

  close() {
    this.modalController.dismiss();
  }
}
