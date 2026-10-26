import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Place } from '../model/place.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeoapifyService {

  private apiKey = environment.geoapifyApiKey;
  private apiUrl = 'https://api.geoapify.com/v1/geocode/autocomplete';

  constructor(private http: HttpClient) { }

  getCitySuggestions(query: string): Observable<Place[]> {
    const url = `${this.apiUrl}?text=${encodeURIComponent(query)}&type=city&lang=de&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(data => 
        data.features.map((city: any) => this.convertToPlace(city, 'city'))
      ),
      catchError(this.handleError)
    );
  }

  getCountrySuggestions(query: string): Observable<Place[]> {
    const url = `${this.apiUrl}?text=${encodeURIComponent(query)}&type=country&lang=de&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(
      map(data => 
        data.features.map((country: any) => this.convertToPlace(country, 'country'))
      ),
      catchError(this.handleError)
    );
  }

  private convertToPlace(item: any, kind: string): Place {
    return {
      name: item.properties.address_line1 || item.properties.name || item.properties.formatted,
      id: item.properties.place_id,
      lat: item.geometry.coordinates[1],
      lon: item.geometry.coordinates[0],
      kind: kind,
      bbox: item.bbox || []
    };
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => new Error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'));
  }


}
