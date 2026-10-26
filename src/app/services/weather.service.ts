import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiKey = environment.weatherApiKey;
  private apiUrl = 'https://api.weatherapi.com/v1/current.json';

  constructor(private http: HttpClient) { }

  getWeather(lat: number, lon: number): Observable<any> {
    const url = `${this.apiUrl}?key=${this.apiKey}&q=${lat},${lon}&aqi=no`;
    return this.http.get(url);
  }

  getWeatherIcon(condition: string): string {
    condition = condition.toLowerCase();
    if (condition.includes('sunny')) {
      return 'sunny';
    } else if (condition.includes('cloudy')) {
      return 'cloudy';
    } else if (condition.includes('rain')) {
      return 'rainy';
    } else {
      return 'partly-sunny';
    }
  }
}
