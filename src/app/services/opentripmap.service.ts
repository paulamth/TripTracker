import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';
import { catchError, firstValueFrom, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { Place } from '../model/place.interface';  
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OpentripmapService {

  private apiKey = environment.opentripmapApiKey;
  private apiUrl = 'https://api.opentripmap.com/0.1/en/places';
  private apiCache = new Map<string, any>();
  
  constructor(private http: HttpClient) { }


  findPlacesInCity(bbox: number[], lat: number, lon: number, kind: string, limit: number){  
    const rat = 1; 
    let url = `${this.apiUrl}/bbox?lon_min=${bbox[0]}&lon_max=${bbox[2]}&lat_min=${bbox[1]}&lat_max=${bbox[3]}&rate=${rat}&format=json&limit=${limit}&apikey=${this.apiKey}`;

    if(kind !== ''){
      url += `&kinds=${kind}`;
    }

    return this.http.get<any[]>(url).pipe(
      map(data => this.convertToPlaceArray(data)),
      catchError(this.handleError)
    );
  }


  async getNearbyPlacesAuto(query: string, kind: string){
    const radius = 4000;

    const position =  await this.getCurrentPosition();
    const lat = position.lat;
    const lon = position.lon;
    const lim = 10;
    const rat = 3; 
    
    let url = `${this.apiUrl}/autosuggest?name=${query}&apikey=${this.apiKey}&radius=${radius}&lon=${lon}&lat=${lat}&rate=${rat}&format=json&limit=${lim}`;

    if(kind !== ''){
      url += `&kinds=${kind}`;
    }

    return this.http.get<any[]>(url).pipe(
      map(data => this.convertToPlaceArray(data)), 
      catchError(this.handleError)
    );
  }

   async getNearbyPlaces(kind: string, limit: number, rate: number):Promise<Place[]>  {
    const radius = 4000;
    const position = await this.getCurrentPosition();
    const lat = position.lat;
    const lon = position.lon;

    // Auf drei Nachkommastellen (ca. 100 m) runden, damit kleine GPS-Schwankungen
    // denselben Cache-Eintrag treffen und keine neue API-Anfrage auslösen
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;

    const cacheKey = `nearbyPlaces_${kind}_${limit}_${rate}_${roundedLat}_${roundedLon}`;


    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey); 
    }

    let url = `${this.apiUrl}/radius?apikey=${this.apiKey}&radius=${radius}&lon=${lon}&lat=${lat}&rate=${rate}&format=json&limit=${limit}`;
    if (kind !== '') {
      url += `&kinds=${kind}`;
    }

    return firstValueFrom(this.http.get<any[]>(url).pipe(
      map(data => this.convertToPlaceArray(data)),
      tap(data => this.apiCache.set(cacheKey, data)),
      catchError(this.handleError)
    ));
}


   async getCurrentPosition(){
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      lat: coordinates.coords.latitude,
      lon: coordinates.coords.longitude,
    };
  }

  getPlaceDetails(xid: string): Observable<any> {
    const cacheKey = `placeDetails_${xid}`;
    if (!this.apiCache.has(cacheKey)) {
      const url = `${this.apiUrl}/xid/${xid}?apikey=${this.apiKey}`;
      // shareReplay(1): Die Antwort wird einmal geladen und bei späteren Abrufen wiederverwendet.
      // Bei einem Fehler wird der Eintrag entfernt, damit der nächste Abruf es erneut versucht.
      const details$ = this.http.get<any>(url).pipe(
        map(details => this.useStandardThumbnailWidth(details)),
        shareReplay(1),
        catchError(error => {
          this.apiCache.delete(cacheKey);
          return throwError(() => error);
        })
      );
      this.apiCache.set(cacheKey, details$);
    }
    return this.apiCache.get(cacheKey);
  }

  /**
   * Wikimedia liefert Vorschaubilder nur noch zuverlässig in Standardbreiten aus.
   * OpenTripMap verweist auf 400 px breite Vorschauen, die nicht mehr laden;
   * sie werden deshalb auf die Standardbreite 500 px umgeschrieben.
   */
  private useStandardThumbnailWidth(details: any): any {
    const source: string | undefined = details?.preview?.source;
    if (source && source.includes('upload.wikimedia.org') && source.includes('/thumb/')) {
      details.preview.source = source.replace(/\/\d+px-/, '/500px-');
    }
    return details;
  }

  private convertToPlaceArray(data: any[]): Place[] {
    return data.map(item => this.convertToPlace(item));
  }

  private convertToPlace(item: any): Place {

    let icon: string;

    switch (true) {
      case item.kinds.includes('natural','gardens_and_parks'):
        icon = 'leaf-outline';
        break;
        case item.kinds.includes('transport'):
        icon = 'bus-outline';
        break;
      case item.kinds.includes('foods'):
        icon = 'restaurant-outline';
        break;
      case item.kinds.includes('accomodations'):
        icon = 'bed-outline';
        break;
      case item.kinds.includes('shops'):
        icon = 'cart-outline';
        break;
      case item.kinds.includes('amusements'):
      icon = 'happy-outline';
      break;
      case item.kinds.includes('cultural','theatres_and_entertainments','museums'):
        icon = 'color-palette-outline';
        break;
      default:
        icon = 'star-outline';
    }

    return {
      name: item.name,
      id: item.xid,
      lat: item.point.lat,
      lon: item.point.lon,
      kind: 'attraction',
      icon: icon,
    };
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'));
  }
}
