import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { SliderComponent } from '../components/slider/slider.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../services/firestore.service';
import { Subscription, firstValueFrom, } from 'rxjs';
import { PLACES } from '../model/places.data';
import { OpentripmapService } from '../services/opentripmap.service';
import { Place } from '../model/place.interface';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, SliderComponent],
})

export class Tab1Page implements OnInit{

  popularDestinations: any[] = [];
  closePlaces: any[] = [];
  favUpdatedSubscription: Subscription | undefined;
  searchHistory: Place[] = [];
  selectedKind: string | null = null;
  

  constructor(
    private firestoreService:FirestoreService, 
    private router: Router, private route:ActivatedRoute,
    private openTripMapService: OpentripmapService,
    private toastController: ToastController)
    {}

  async ngOnInit(): Promise<void> {
    await this.loadPopularDestionations();
    await this.loadCloseAttractions('');  
  
  }

  async ionViewWillEnter() {
    this.loadSearchHistory();
  }

  loadSearchHistory() {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      this.searchHistory = JSON.parse(storedHistory);
    } else {
      this.searchHistory = [];
    }
  }

  async loadPopularDestionations(){
    this.popularDestinations = PLACES.map(place => ({
      slider: 'assets/img/'+place.name.toLowerCase()+'.jpg', 
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      kind: place.kind,
      id: place.id,
      bbox: place.bbox 
    }));
  }

  async loadCloseAttractions(kind: string) {
    this.closePlaces = [];
    
    try {
      if (this.selectedKind === kind) {
        this.selectedKind = '';
      } else {
        this.selectedKind = kind;
      }
      const nearbyPlaces = this.openTripMapService.getNearbyPlaces(this.selectedKind || '', 10, 2);
      
      for (const place of await nearbyPlaces) {
        const details: any = await firstValueFrom(await this.openTripMapService.getPlaceDetails(place.id));
  
        const street = details.address?.road || details.address?.street || undefined;
        const housenumber = details.address?.house_number || undefined;
        const city = details.address?.city || details.address?.town || details.address?.village || undefined;
  
        const imageSource = details.preview?.source
          ? details.preview.source
          : 'assets/img/default.jpg';
  
        this.closePlaces.push({
          slider: imageSource,
          name: place.name,
          lat: place.lat,
          lon: place.lon,
          kind: place.kind,
          street: street,
          housenumber: housenumber,
          id: place.id,
          city: city,
          website: details.wikipedia
        });
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Attraktionen:', error);
    }
  }
  
  
  async ionViewDidEnter() {
    this.updateFavorites();
    this.favUpdatedSubscription = this.firestoreService.favUpdated$.subscribe(() => {
    this.updateFavorites();
    });
  }

  async updateFavorites(){
    for (let slide of this.popularDestinations) {
      slide.isFavorite = await this.firestoreService.doesPlaceExist(slide.id);
    }
    for (let slide of this.closePlaces) {
      slide.isFavorite = await this.firestoreService.doesPlaceExist(slide.id);
    }
  }

  onSlideClicked(slideIndex: number, sliderType: string) {
    let place;
    if(sliderType === 'popDes'){
      place = this.popularDestinations[slideIndex];
      this.router.navigate(['detail'], {
        relativeTo: this.route,
        state: { place, tab: 'tab1' }
    });
  }
  else{
    place = this.closePlaces[slideIndex];
    window.open(place.website, '_blank');
  }
  }

  async addPlace(slideIndex: number, sliderType: string) {
    let place;
   if(sliderType === 'popDes'){
      place = this.popularDestinations[slideIndex];
    }
    else{
      place = this.closePlaces[slideIndex];
    }
    this.firestoreService.presentAddToast(place);
  }

  async deletePlace(slideIndex: number, sliderType: string) {
    let place;
    if(sliderType === 'popDes'){
      place = this.popularDestinations[slideIndex];
    }
    else{
      place = this.closePlaces[slideIndex];
    }
    this.firestoreService.presentDeleteToast(place);
  }

  goToProfil(){
    this.router.navigate(["/tabs/tab4"]);
  }

  async getCurrentPlace(): Promise<Place> {
    const position = await this.openTripMapService.getCurrentPosition();
    const place: Place = {
      name: 'Aktueller Standort',
      lat: position.lat,
      lon: position.lon,
      id: 'current-location',
      kind: 'Umgebung',
    };
  
    return place; 
  }
  

  async goToMap(){
    try {
      const place = await this.getCurrentPlace();
      this.router.navigate(['map'], {
        state: {place, page: 'tab1'}
      });
    } catch (error: any) {
      // Ohne Standort kann die Karte nicht geöffnet werden. Fehlercodes der Geolocation-API:
      // 1 = Zugriff verweigert, 2 = Standort nicht verfügbar, 3 = Zeitüberschreitung
      console.error('Standort konnte nicht ermittelt werden:', error);
      const message = error?.code === 1
        ? 'Der Standortzugriff ist nicht erlaubt. Bitte geben Sie ihn im Browser bzw. in den Einstellungen frei.'
        : 'Ihr Standort konnte nicht ermittelt werden. Bitte versuchen Sie es erneut.';
      const toast = await this.toastController.create({ message, color: 'danger', duration: 4000, position: 'bottom' });
      await toast.present();
    }
  }

  viewDetails(place: Place) {
    if (place) {
      this.router.navigate(['detail'], {
        relativeTo: this.route,
        state: { place, tab: 'tab1' }
      });
    }
  }

  getFilteredSearchHistory() {
    return this.searchHistory.filter(item => item.kind !== 'attraction');
  }
  
}

