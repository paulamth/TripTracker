import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AddTripModalComponent } from '../components/add-trip-modal/add-trip-modal.component';
import { FirestoreService } from '../services/firestore.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Trip } from '../model/trip.interface';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  trips: Trip[] = [];
  selectedTrip: any = null;
  placeCounts: { [tripName: string]: number } = {}; 
  selectedSortOption: string = 'name'; 


  constructor(
    private firestoreService: FirestoreService, 
    private modalController:ModalController, 
    private router: Router, 
    private route: ActivatedRoute) 
    {}


  async ionViewWillEnter() {
     await this.load();
  }
  
  async load(){
    this.trips = await this.firestoreService.getSortedTrips(this.selectedSortOption);
    for (let trip of this.trips) {
      const count = await this.firestoreService.countPlacesForTrip(trip);
      this.placeCounts[trip.name] = count;
    }
  };

  selectTrip(trip: any) {
    this.selectedTrip = trip;
    this.router.navigate(['trip-overview'], {
      relativeTo: this.route,
      state: { trip }
    });
}

  onSortOptionChange() {
    this.load();
  }

  async openAddPlaceDialog() {
    const modal = await this.modalController.create({
      component: AddTripModalComponent
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.newTrip === true) {
      this.load();
    }
  }

}
