import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/model/place.interface';
import { Trip } from 'src/app/model/trip.interface';
import { FirestoreService } from 'src/app/services/firestore.service';
import { TripSettingsModalComponent } from '../../components/trip-settings-modal/trip-settings-modal.component';
import { AddDateToPlaceModalComponent } from 'src/app/components/add-date-to-place-modal/add-date-to-place-modal.component';

@Component({
  selector: 'app-trip-overview',
  templateUrl: './trip-overview.page.html',
  styleUrls: ['./trip-overview.page.scss'],
})
export class TripOverviewPage implements OnInit {

  trip!: Trip;
  selectedSegment: string = 'all';  
  places: Place[] = [];
  daysInRange: { date: string; isPast: boolean; hasAvailablePlaces: boolean; places: Place[] }[] = [];
  expandedItem: string | null = null;

  constructor(
    private router:Router, 
    private firestoreService: FirestoreService, 
    private modalController: ModalController,
    private route: ActivatedRoute) 
    {}

  async ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as { trip: Trip };
      if (state?.trip) {
        this.trip = state.trip;
        this.places = await this.firestoreService.getPlacesForTrip(this.trip.name);
        this.calculateDaysInRange();
      }
    }
  }

  async ionViewWillEnter() {
    this.selectedSegment = 'all';
    this.places = await this.firestoreService.getPlacesForTrip(this.trip.name);
    this.calculateDaysInRange();
  }

  async segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async openSettings() {
    const modal = await this.modalController.create({
      component: TripSettingsModalComponent,
      componentProps: {
        trip: this.trip
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.updatedTrip) {
      this.trip = data.updatedTrip;
      this.calculateDaysInRange();
    }
  }

  selectPlace(place: Place) {
    if (place.kind === 'city') {
      this.router.navigate(['../detail'], {
        relativeTo: this.route,
        state: { place, tab: 'tab3/trip-overview' }
      });
    } else if (place.kind === 'attraction') {
      this.expandedItem = this.expandedItem === place.id ? null : place.id;
    }
  }

  async addDate(trip: Trip, date: string) {
    const modal = await this.modalController.create({
      component: AddDateToPlaceModalComponent, 
      componentProps: { 
        trip: trip, 
        date: date             
    }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data && data.updated) {
      this.calculateDaysInRange();
    }
  }

  // Berechnet die Tage im Reisezeitraum und prüft, ob verfügbare Orte existieren
  async calculateDaysInRange() {
    if (this.trip.startDate && this.trip.endDate) {
      const startDateISO = this.formatDateToISO(this.trip.startDate);
      const endDateISO = this.formatDateToISO(this.trip.endDate);
  
      const startDate = new Date(startDateISO);
      const endDate = new Date(endDateISO);
  
      const days: { date: string, isPast: boolean, hasAvailablePlaces: boolean, places: Place[] }[] = [];
      let currentDate = new Date(startDate);
  
      while (currentDate <= endDate) {

        const formattedDate = this.formatDate(currentDate.toISOString().split('T')[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = currentDate < today;
        days.push({ date: formattedDate, isPast,  hasAvailablePlaces: false, places: [] });
        currentDate.setDate(currentDate.getDate() + 1);
      }
  
      this.daysInRange = days;
      this.loadPlacesForDays();
    }
  }

  // Lädt die Orte für die berechneten Tage und prüft, ob verfügbare Orte existieren
  async loadPlacesForDays() {
    const hasPlacesPromises = this.daysInRange.map(day => this.hasAvailablePlacesForDate(day.date));
    const placesPromises = this.daysInRange.map(day => this.getPlacesForDate(this.trip, day.date));
  
    const hasPlacesResults = await Promise.all(hasPlacesPromises);
    const placesResults = await Promise.all(placesPromises);
  
    this.daysInRange.forEach((day, index) => {
      day.hasAvailablePlaces = hasPlacesResults[index];
      day.places = placesResults[index];
    });
  }
  

  // Holt die Orte für ein bestimmtes Datum der Reise
  async getPlacesForDate(pTrip: Trip, date: string): Promise<Place[]> {
    const placesForDate: Place[] = [];

    for (let place of this.places) {

      const placeUsedIn = await this.firestoreService.getPlaceUsedIn(place.id);
      if (placeUsedIn.trips) {
        const trip = placeUsedIn.trips.find(t => t.tripName === pTrip.name);
        if (trip && trip.plannedDates && trip.plannedDates.includes(date)) {
          placesForDate.push(place);
        }
      }
    }
    return placesForDate;
  }

  async removePlace(place: Place, event: MouseEvent) {
    event.stopPropagation();
    await this.firestoreService.deletePlace(place.id, this.trip.name);
    this.places = await this.firestoreService.getPlacesForTrip(this.trip.name);
    this.calculateDaysInRange();
  }

  
  async hasAvailablePlacesForDate(date: string): Promise<boolean> {
    const availablePlaces = await this.firestoreService.getAvailablePlacesForDate(this.trip, date);
    return availablePlaces.length > 0;
  }
  

  async removePlaceFromDate(date: string, place: Place, event: MouseEvent){
    event.stopPropagation();
    await this.firestoreService.removeDateFromPlaceForTrip(place, this.trip.name, date);
    this.calculateDaysInRange();
    this.expandedItem = null;
  }

  formatDateToISO(date: string): string {
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
  }
  
  formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  }

  search(){
    this.router.navigate(["/tabs/tab2"]);
  }

  goBack() {
    this.router.navigate(["/tabs/tab3"]);
  }
}
