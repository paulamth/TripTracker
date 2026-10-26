import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  setItem(key: string, value: any): void {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Fehler beim Speichern in LocalStorage:', error);
    }
  }

  getItem(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        return parsedItem;
      }
      return null; 
    } catch (error) {
      console.error('Fehler beim Abrufen aus LocalStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
