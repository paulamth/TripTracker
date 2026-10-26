import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/model/place.interface';
import { FirestoreService } from 'src/app/services/firestore.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-select-trip-modal',
  templateUrl: './save-place-modal.component.html',
  styleUrls: ['./save-place-modal.component.scss'],
})
export class SavePlaceModalComponent  implements OnInit {

  trips: any[] = [];
  isWishlistSelected: boolean = false;
  existingTripNames: string[] = [];
  selectedItems: any[] = [];

  @Input() place!: Place;

  constructor(
    private firestoreService: FirestoreService, 
    private modalController: ModalController,
    private localStorageService: LocalStorageService) 
    {}

  async ngOnInit() {
    this.trips = await this.firestoreService.getTrips();
     this.existingTripNames = await this.firestoreService.getPlaceTrips(this.place.id);

     this.trips.forEach(trip => {
      if (this.existingTripNames.includes(trip.name)) {

        this.selectedItems.push({ type: 'trip', data: trip }); 
        trip.selected = true;
      }
    });

    if (await this.firestoreService.isInWishlist(this.place.id)) {
      this.isWishlistSelected = true;
      this.selectedItems.push({ type: 'wishlist', data: this.place });
    }
  }

  toggleSelection(trip: any) {
    const index = this.selectedItems.findIndex(item => item.type === 'trip' && item.data.id === trip.id);
  
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push({ type: 'trip', data: trip }); 
    }
  }
  
  toggleWishlistSelection() {
    const index = this.selectedItems.findIndex(item => item.type === 'wishlist');
  
    if (this.isWishlistSelected) {
      if (index === -1) {
        this.selectedItems.push({ type: 'wishlist', data: this.place }); 
      }
    } else {
      if (index > -1) {
        this.selectedItems.splice(index, 1); 
      }
    }
  }
  
  async save() {
    try {
      // Sammle die Trips und Merkliste, die hinzugefügt oder entfernt werden sollen
      const tripsToRemove = this.existingTripNames.filter(
        tripName => !this.selectedItems.some(item => item.type === 'trip' && item.data.name === tripName)
      );
      const tripsToAdd = this.selectedItems.filter(
        item => item.type === 'trip' && !this.existingTripNames.includes(item.data.name)
      );
  
      // Entferne Häkchen von der Merkliste, falls diese abgewählt wurde
      const removeFromWishlist = !this.isWishlistSelected && await this.firestoreService.isInWishlist(this.place.id);
  
      // Füge Trips hinzu, die ausgewählt wurden, aber noch nicht in der Liste vorhanden sind
      for (const item of tripsToAdd) {
        const tripName = item.data.name;
        await this.firestoreService.addPlace(this.place, tripName);
      }
  
      // Entferne Trips, die abgewählt wurden
      for (const tripName of tripsToRemove) {
        await this.firestoreService.deletePlace(this.place.id, tripName);
      }
  
      // Füge den Ort zur Merkliste hinzu, falls diese ausgewählt wurde und noch nicht enthalten ist
      if (this.isWishlistSelected && !(await this.firestoreService.isInWishlist(this.place.id))) {
        await this.firestoreService.addPlace(this.place, 'wishlist');
      }
  
      // Entferne den Ort von der Merkliste, falls diese abgewählt wurde
      if (removeFromWishlist) {
        await this.firestoreService.deletePlace(this.place.id, 'wishlist');
      }
  
      const lastAddedItem = this.selectedItems[this.selectedItems.length - 1];
      this.localStorageService.setItem('lastAddedItem', lastAddedItem);

      this.modalController.dismiss(this.selectedItems);

      // Liste mit den Namen der Speicherorte 
      const addedLists = tripsToAdd.map(item => item.data.name);
      if (this.isWishlistSelected) {
        addedLists.push('Merkliste');
      }

      // Toast nur anzeigen, wenn etwas hinzugefügt wurde
      if (addedLists.length > 0) {
        const message = `Hinzugefügt zu: ${addedLists.join(', ')}`;
        await this.firestoreService.showToast(message, 3000, 'secondary');
    }
    } catch (error) {
      console.error('Fehler beim Speichern des Places:', error);
    }
  }
  

  close() {
    this.modalController.dismiss();
  }
}
