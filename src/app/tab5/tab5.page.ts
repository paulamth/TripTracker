import { Component } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { Place } from '../model/place.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { AddToTripComponent } from '../components/add-to-trip/add-to-trip.component';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page {

  wishlist: Place[] = [];
  isFavorite: boolean[] = [];
  expandedItem: string | null = null;


  constructor(
    private firestoreService: FirestoreService, 
    private router:Router, 
    private route: ActivatedRoute,
    private modalController: ModalController,
    private toastController: ToastController)
    {}


  async ionViewWillEnter() {
    await this.updateWishlist();
  }

  async updateWishlist(){
    this.wishlist = await this.firestoreService.getWishlist();
    this.isFavorite = await Promise.all(
      this.wishlist.map(place => this.firestoreService.isInWishlist(place.id))
    );
  }

  selectPlace(place: Place) {
    if (place.kind === 'city') {
      this.router.navigate(['detail'], {
        relativeTo: this.route,
        state: { place, tab: 'tab5' }
      });
    } else if (place.kind === 'attraction') {
      this.expandedItem = this.expandedItem === place.id ? null : place.id;
    }
  }

  async closeDetails(placeId: string){
    this.expandedItem = this.expandedItem === placeId ? null : placeId;
  }

  async addToTrip(place: Place, event: Event) {
    event.stopPropagation();
    const canBeSaved = await this.checkAlreadySavedInTrips(place);
    const existTrips = (await this.firestoreService.getTrips()).length >0;
    if (canBeSaved) {
        this.openAddToTripModal(place);
    }
    else {
      var toast;
      if(existTrips){
         toast = await this.toastController.create({
          message: "Ist bereits in allen Reisen gespeichert",
          duration: 2000
        });
      }
      else{
          toast = await this.toastController.create({
          message: "Es existiert keine Reise.",
          duration: 1500,
          color: 'danger',
          buttons: [
            {
              text: 'Reise erstellen',
              handler: async () => {
                this.router.navigate(["/tabs/tab3"]);  
              }
            }
          ]
        });
      }
      
    await toast.present();
    }
  }

  async checkAlreadySavedInTrips(place: Place): Promise<boolean> {
    const allTrips = await this.firestoreService.getTrips();
     const existingTripNames = await this.firestoreService.getPlaceTrips(place.id);
     const tripsNotContainingPlace = allTrips.filter(trip => !existingTripNames.includes(trip.name));
     return tripsNotContainingPlace.length > 0;
  }

  async openAddToTripModal(place: Place) {
    const modal = await this.modalController.create({
      component: AddToTripComponent,
      componentProps: { place }
    });
    return await modal.present();
  }
  

  deleteFromWishlist(index: number, event: MouseEvent) {
    event.stopPropagation();
    const icon = event.target as HTMLElement;
    icon.classList.add('fade-out');

    // Erst aus der Liste nehmen, dann löschen: Die Firestore-Antwort kommt außerhalb
    // der Angular-Änderungserkennung an, die Liste würde sonst nicht neu gezeichnet.
    setTimeout(async () => {
      const place = this.wishlist[index];
      const favorite = this.isFavorite[index];
      this.wishlist.splice(index, 1);
      this.isFavorite.splice(index, 1);
      try {
        await this.firestoreService.deletePlace(place.id, 'wishlist');
      } catch {
        this.wishlist.splice(index, 0, place);
        this.isFavorite.splice(index, 0, favorite);
        const toast = await this.toastController.create({
          message: 'Der Ort konnte nicht von der Merkliste entfernt werden.',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    }, 300);
  }

  search(){
    this.router.navigate(["/tabs/tab2"]);
  }

    
}
