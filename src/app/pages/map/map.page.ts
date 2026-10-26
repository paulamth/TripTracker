import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, Subscription } from 'rxjs';
import { LeafletMapComponent } from 'src/app/components/leaflet-map/leaflet-map.component';
import { Place } from 'src/app/model/place.interface';
import { OpentripmapService } from 'src/app/services/opentripmap.service';
import { WeatherService } from 'src/app/services/weather.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements AfterViewInit, OnDestroy {

  @ViewChild(LeafletMapComponent) leafletMap!: LeafletMapComponent;
  
  viewMode: string = 'map';
  categories = [
    { label: 'Beliebt', value: 'interesting_places', selected: true },
    { label: 'Amusements', value: 'amusements', selected: false },
    { label: 'Hotels', value: 'accomodations', selected: false },
    { label: 'Museen', value: 'museums', selected: false },
    { label: 'Theater', value: 'theatres_and_entertainments', selected: false },
    { label: 'Natur', value: 'natural,gardens_and_parks', selected: false },
    { label: 'Essen', value: 'foods', selected: false },
    { label: 'Shops', value: 'shops', selected: false },
    { label: 'Transport', value: 'transport', selected: false },
  ];
  rate: number = 1;
  place!: Place;
  places: any[] = [];
  page!: string;
  zoom!: number;
  selectedPlace: Place | null = null;
  private markerClickSubscription: Subscription | null = null; 
  weatherData: any = {};
  weatherIcon: string = '';

  constructor(
    private openTripMapService: OpentripmapService,
    private weatherService: WeatherService,
    private router: Router) {
      const navigation =  this.router.getCurrentNavigation();
      if (navigation?.extras.state) {
        this.place = navigation.extras.state['place'];
        this.page = navigation.extras.state['page'];
        this.zoom = this.place.kind === 'city' ? 12 : this.place.kind  === 'country' ? 6 : this.place.kind  === 'Umgebung' ? 14 : 12;
      }
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.place) {
      this.leafletMap.changeMapView(this.place.lat, this.place.lon, this.zoom); 
      await this.loadWeather();
    }
    setTimeout(async () => {
      await this.loadNearbyPlaces();
      this.markerClickSubscription = this.leafletMap.markerClicked.subscribe((place: Place | null) => {
        this.setSelectedPlace(place);
      });
      this.leafletMap.setZoom(this.zoom);
    }, 100); 
  }

  // Holt die gewählten Kategorien als String
  getSelectedCategoriesString(): string {
    const selectedCategories = this.categories.filter(c => c.selected).map(c => c.value);
    return selectedCategories.join(',');
  }

  // Lädt nahegelegene Orte basierend auf gewählten Kategorien
  async loadNearbyPlaces() {
    this.places = [];
    this.leafletMap.clearMarkers();
    const selectedCategoriesString = this.getSelectedCategoriesString();
    if(selectedCategoriesString !== ''){
      if(this.place.name === 'Aktueller Standort'){
        this.places =  await this.openTripMapService.getNearbyPlaces(selectedCategoriesString, 30, this.rate);
      }
      else{
        this.places =  await lastValueFrom(await this.openTripMapService.findPlacesInCity(this.place.bbox || [], this.place.lat, this.place.lon, selectedCategoriesString, 30));
      }
      this.addMarker();
    }
    if(this.place.name === 'Aktueller Standort'){
      this.leafletMap.addCircle(this.place.lat, this.place.lon);
    }
  }

  // Setzt den aktuell angeklickten Ort
  setSelectedPlace(place: Place | null): void {
    if (place === null) {
      this.clearSelectedPlace(); 
    } else {
      this.selectedPlace = place;
    }
  }

  clearSelectedPlace(): void {
    if (this.selectedPlace) {
      this.leafletMap.updateSelectedMarker(this.selectedPlace.lat, this.selectedPlace.lon); 
    }
    this.selectedPlace = null;
    this.leafletMap.changeMapView(this.place.lat, this.place.lon, this.zoom);
  }

  async addMarker(){
    if (this.places.length > 0) {
      this.places.forEach(place => {
        this.leafletMap.addMarker(place, true)
      });
    }
    if(this.place.name === 'Aktueller Standort'){
      this.leafletMap.addCircle(this.place.lat, this.place.lon);
    }
  }

  async loadWeather() {
    await this.weatherService.getWeather(this.place.lat, this.place.lon).subscribe(
      (data) => {
        this.weatherData = data;
        this.weatherIcon = this.weatherService.getWeatherIcon(this.weatherData.current.condition.text);
      },
      (error) => {
        console.error('Fehler beim Abrufen der Wetterdaten:', error);
      }
    );
  }


  ngOnDestroy(): void {
    this.markerClickSubscription?.unsubscribe();
  }

  goBack() {
    this.leafletMap.ngOnDestroy();
    this.router.navigate(["/tabs/"+this.page]);
  }
}
