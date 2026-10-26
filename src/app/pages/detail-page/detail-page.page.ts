import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LeafletMapComponent } from 'src/app/components/leaflet-map/leaflet-map.component';
import { OpentripmapService } from 'src/app/services/opentripmap.service';
import { Place } from '../../model/place.interface'; 
import { FirestoreService } from 'src/app/services/firestore.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { WeatherService } from 'src/app/services/weather.service';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.page.html',
  styleUrls: ['./detail-page.page.scss'],
})
export class DetailPagePage implements OnInit, AfterViewInit{

  @ViewChild(LeafletMapComponent) leafletMap!: LeafletMapComponent;

  place!: Place;
  places: Place[] = [];
  selectedSegment: string = 'all';  
  isPlaceFav: boolean = false;
  isAttractionFav: boolean = false;
  favUpdatedSubscription: Subscription | undefined;
  initialLoadCount: number = 10;
  currentTab!: string;
  expandedItem: string | null = null;
  currentAttractionId: string = '';
  weatherData: any = {};
  weatherIcon: string = '';
  hasMorePlaces: boolean = true;
  zoom!: number;

  constructor(
    private firestoreService: FirestoreService, 
    private weatherService: WeatherService,
    private openTripMapService: OpentripmapService, 
    private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.place = navigation.extras.state['place'];
      this.currentTab = navigation.extras.state['tab'];
      this.zoom = this.place.kind === 'city' ? 12 : this.place.kind  === 'country' ? 6 : 12;
    }
    }

  async ngOnInit(): Promise<void> {
    await this.loadPlaces('',this.initialLoadCount);
    this.addMarkerForPlaces();
    this.updateFavorites();
    this.favUpdatedSubscription = this.firestoreService.favUpdated$.subscribe(() => {this.updateFavorites();});
    await this.loadWeather();
  }

  // Die Karte erst ansteuern, wenn die LeafletMapComponent vollständig geladen ist
  async ngAfterViewInit(): Promise<void> {
    if (this.place) {
      await this.loadMap(this.place.lat, this.place.lon);
    }
  }

  async updateFavorites(){
    this.isPlaceFav = await this.firestoreService.doesPlaceExist(this.place.id);
    if(this.currentAttractionId!=='')
    {
      this.isAttractionFav = await this.firestoreService.doesPlaceExist(this.currentAttractionId);
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
  
  async segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.places = [];
    await this.filterPlaces(this.initialLoadCount);
    this.addMarkerForPlaces();
  }

  async filterPlaces(limit:number) {
    if (this.selectedSegment === 'all') {
        await this.loadPlaces('',limit);    } 
      else {
        await this.loadPlaces(this.selectedSegment,limit);    
      }
  }

  async loadMore():  Promise<void> {
    await this.filterPlaces(this.places.length+5);
    this.addMarkerForPlaces();
  }

  goBack() {
    this.router.navigate(["/tabs/"+this.currentTab]);
  }

  async loadMap(lat: number, lon: number): Promise<void>{
    if (this.leafletMap) {
      this.leafletMap.changeMapView(lat, lon, this.zoom); 
    }
  }

  async loadPlaces(selectedSegment: string, limit: number): Promise<void> {
  
    const places$ = this.openTripMapService.findPlacesInCity(this.place.bbox || [], this.place.lat, this.place.lon, selectedSegment, limit);
    
    const newPlaces = await firstValueFrom(await places$);
      if (newPlaces.length > 0) {
        // Filtere die neuen Orte, um nur neue hinzuzufügende Orte zu erhalten
        const filteredPlaces = newPlaces.filter((place: { name: string; }) => 
          !this.places.some(existingPlace => existingPlace.name === place.name)
        );
        if (filteredPlaces.length === 0) {
          this.hasMorePlaces = false;
        } else {
          this.hasMorePlaces = true;
        }
        
        this.places = [...this.places, ...filteredPlaces];
      }
  }
  
  addMarkerForPlaces(): void{
    if (this.leafletMap) {
      this.leafletMap.clearMarkers();
      for (const place of this.places) {
        this.leafletMap.addMarker(place, false);
      }
    }
  }

  togglePlaceHeart() {
    if (this.isPlaceFav) {
      this.firestoreService.presentDeleteToast(this.place);
    } else {
      this.firestoreService.presentAddToast(this.place);
    }
  }

  async toggleAttractionHeart(place: Place) {
    if (this.isAttractionFav) {
      await this.firestoreService.presentDeleteToast(place);
    } else {
      await this.firestoreService.presentAddToast(place);
    }
  }

  async showAttractionDetails(place: Place) {
    this.expandedItem = this.expandedItem === place.id ? null :  place.id;
    this.currentAttractionId =  place.id;
    this.isAttractionFav = await this.firestoreService.doesPlaceExist( place.id);
    
    if (this.expandedItem ===  place.id) {
      this.leafletMap.updateSelectedMarker(place.lat,place.lon);
    }
  }

  async goToMap(){
    this.router.navigate(['map'], {
      state: { place: this.place, page: this.currentTab+'/detail' }
    });
  }
}

