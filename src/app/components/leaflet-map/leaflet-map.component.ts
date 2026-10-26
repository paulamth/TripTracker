import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Place } from 'src/app/model/place.interface';
import { EventEmitter, Output } from '@angular/core';

// Kartendarstellung mit Leaflet: https://leafletjs.com

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {

  private map!: L.Map;
  private markersGroup = L.layerGroup(); 
  @Input() mapId: string = 'mapElement'; 
  private selectedMarker: L.Marker | null = null;
  private zoom!:number;
  @Output() markerClicked = new EventEmitter<Place | null>();

  defaultIcon = L.icon({
    iconUrl: 'assets/icon/marker.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -30],
  });

  selectedIcon = L.icon({
    iconUrl: 'assets/icon/marker-clicked.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -30],
  });

  ngAfterViewInit(): void {
    this.initMap(52.2799, 8.0472);
  }

  initMap( lat:number,  lon:number): void {
    const mapElement = document.getElementById(this.mapId);

    if (mapElement && !this.map) {
      this.map = L.map(mapElement).setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.markersGroup.addTo(this.map);

      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    } 
  }

  changeMapView(lat: number, lon: number, zoom: number): void {
    if (this.map) {
      this.map.flyTo([lat, lon], zoom);
    }
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  setZoom(zoom: number): void{
    this.zoom = zoom;
  }

  // Prüft, ob der gewählte Marker bereits ausgewählt ist
  updateSelectedMarker(lat: number, lon: number): boolean {
    return this.isSameMarker(lat, lon) ? (this.deselectMarker(), true) : false;
  }
  
  // Vergleicht, ob die Koordinaten mit dem ausgewählten Marker übereinstimmen
  isSameMarker(lat: number, lon: number): boolean {
    return this.selectedMarker?.getLatLng().lat === lat && this.selectedMarker?.getLatLng().lng === lon;
  }
  
  // Markiert einen Marker als ausgewählt und zoomt darauf
  selectMarker(marker: L.Marker, lat: number, lon: number): void {
    this.deselectMarker();
    this.selectedMarker = marker;
    this.selectedMarker.setIcon(this.selectedIcon);
    this.map.flyTo([lat, lon], this.zoom + 2);
  }
  
  // Hebt die Auswahl eines Markers auf
  deselectMarker(): void {
    if (this.selectedMarker) {
      this.selectedMarker.setIcon(this.defaultIcon);
      this.selectedMarker = null;
    }
  }
  
  addMarker(place: Place, clickable: boolean): void {
    const myIcon = L.icon({
      iconUrl: 'assets/icon/marker.png',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -30],
    });
  
    const marker = L.marker([place.lat, place.lon], { icon: myIcon }).addTo(this.markersGroup);
  
    if(clickable){
      marker.on('click', () => {
        const isSameMarker = this.updateSelectedMarker(place.lat, place.lon);
    
        if (!isSameMarker) {
          this.selectMarker(marker, place.lat, place.lon);
          this.markerClicked.emit(place);
        } else {
          this.markerClicked.emit(null);
        }
      });
    }
   
  }
  
// Fügt einen blauen Kreis als Standortmarker hinzu
  addCircle(lat: number, lon:number): void{
        const circle = L.circleMarker([lat, lon], {
          color: 'blue',
          radius: 10, 
          fillOpacity: 0.6,
          weight: 3
        }).addTo(this.markersGroup);
        circle.bindPopup('Aktueller Standort');
  }

  clearMarkers(): void {
    this.markersGroup.clearLayers();
  }


  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined as any; 
    }
  }

}
