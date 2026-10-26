import { Component, OnInit } from '@angular/core';
import { OpentripmapService } from '../services/opentripmap.service';
import { GeoapifyService } from '../services/geoapify.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Place } from '../model/place.interface'; 
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})

export class Tab2Page implements OnInit{
  cities: Place[] = [];
  countries: Place[] = [];
  searchTerm: string = '';
  attractions: Place[] = [];
  selectedSegment: string = 'trip';
  placeholderText: string = 'Suche nach Reisezielen'; 
  searchHistory: Place[] = [];
  expandedItem: string | null = null;
  isAttractionFav: boolean = false;
  currentAttractionId: string = '';
  favUpdatedSubscription: Subscription | undefined;


  constructor(
    private geoapifyService: GeoapifyService, 
    private openTripMapService: OpentripmapService,  
    private router: Router, private route:ActivatedRoute,
    private firestoreService: FirestoreService) 
    {
    }

  ngOnInit(): void {
    this.updateFavorites();
    this.favUpdatedSubscription = this.firestoreService.favUpdated$.subscribe(() => {
    this.updateFavorites();
    });
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

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    if (this.selectedSegment === 'trip') {
      this.placeholderText = 'Suche nach Reisezielen';
    } else if (this.selectedSegment === 'attraction') {
      this.placeholderText = 'Suche nach Attraktionen in deiner Nähe';
    }
      this.searchPlaces();
    
  }

  selectPlace(place: Place) {
    this.addPlacetoSearchHistory(place);
    this.router.navigate(['detail'], {
      relativeTo: this.route,
      state: { place, tab: 'tab2' }
    });
    this.clearResults();
  }

  addPlacetoSearchHistory(place: Place){
    const exists = this.searchHistory.some(item => item.name === place.name && item.lat === place.lat && item.lon === place.lon);
    if (!exists) {
      this.searchHistory.unshift(place);

      if (this.searchHistory.length > 5) {
          this.searchHistory.pop(); 
      }
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
  }

  async searchPlaces(){
    if(this.searchTerm.length===0){
      this.clearResults();
    }
    else if (this.searchTerm.length >= 3) {
      if (this.selectedSegment === 'trip') {
        this.searchCities();
        this.searchCountries();
      } else if (this.selectedSegment === 'attraction') {
        this.searchAttractions();
      }
    }
  }

  async searchAttractions() {
    try {
        (await this.openTripMapService.getNearbyPlacesAuto(this.searchTerm, '')).subscribe((formattedData: any) => {
            this.attractions = formattedData; 
        });
    } catch (error) {
        console.error('Error fetching attractions:', error);
    }
  }

  async clearResults(){
    this.countries = [];
    this.cities = [];
    this.attractions = [];
    this.searchTerm = '';
  }
  
  async searchCities() {
    try {
        this.cities = await firstValueFrom(this.geoapifyService.getCitySuggestions(this.searchTerm));
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }   
  }

  async searchCountries() {
    try {
      this.countries = await firstValueFrom(this.geoapifyService.getCountrySuggestions(this.searchTerm));
    } catch (error) {
        console.error('Error fetching country suggestions:', error);
    }
  }

  async showAttractionDetails(attraction: Place) {
    this.expandedItem = this.expandedItem === attraction.id ? null : attraction.id;
    this.currentAttractionId = attraction.id;
    this.addPlacetoSearchHistory(attraction);
    this.isAttractionFav = await this.firestoreService.doesPlaceExist(attraction.id);
  }

  async toggleAttractionHeart(place: Place) {
    if (this.isAttractionFav) {
      await this.firestoreService.presentDeleteToast(place);
    } else {
      await this.firestoreService.presentAddToast(place);
    }
  }

  async updateFavorites(){
    if(this.currentAttractionId!=='')
    {
      this.isAttractionFav = await this.firestoreService.doesPlaceExist(this.currentAttractionId);
    }
}
}