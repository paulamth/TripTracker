import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import {Observable, Subject, firstValueFrom} from 'rxjs';
import { AuthService } from './auth.service';
import { Place } from '../model/place.interface'; 
import { Trip } from '../model/trip.interface';
import { User } from '../model/user.interface';
import { ModalController, ToastController } from '@ionic/angular';
import { SavePlaceModalComponent } from '../components/save-place-modal/save-place-modal.component';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})

export class FirestoreService {

  constructor(
    private firestore: Firestore, 
    private authService: AuthService, 
    private toastController: ToastController, 
    private modalController:ModalController,
    private localStorageService: LocalStorageService) 
    {}

  private favUpdated = new Subject<void>(); 
  favUpdated$ = this.favUpdated.asObservable();

  /**
   * ID des angemeldeten Nutzers aus Firebase Auth.
   * Ohne Anmeldung wird abgebrochen, statt unter "users/null" zu lesen oder zu schreiben.
   */
  private async requireUserId(): Promise<string> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Nicht angemeldet.');
    }
    return userId;
  }

  // Fügt einen Ort hinzu oder ergänzt ihn um einen weiteren Speicherort, falls er bereits existiert
  async addPlace(place: Place, used_in: string){
    const placeExists = await this.doesPlaceExist(place.id);
    if (placeExists) {
      await this.updatePlaceUsedIn(place, used_in);
    } else {
      await this.addNewPlace(place, used_in);
    }
  }

  // Ort existiert bereits: Merkliste bzw. Reise in used_in ergänzen
  async updatePlaceUsedIn(place: Place, used_in: string): Promise<void> {
    const userId = await this.requireUserId();
    const placeId = place.id;

    if (placeId != null) {
      const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
      const placeUsedIn = await this.getPlaceUsedIn(placeId);

      if (used_in === "wishlist") {
        if (!placeUsedIn.wishlist) {
          await updateDoc(placeDocRef, {
            used_in: {
                ...placeUsedIn,
                wishlist: true
            }
          });
        }
      } else {
        const trips = placeUsedIn.trips || [];
            const tripExists = trips.some(trip => trip.tripName === used_in);
            
            if (!tripExists) {
                await updateDoc(placeDocRef, {
                    used_in: {
                        ...placeUsedIn,
                        trips: [...trips, { tripName: used_in, plannedDates: [] }]
                    }
                });
        }
      }
    }
    this.favUpdated.next();
  }

    // Plant einen Ort innerhalb einer Reise für ein bestimmtes Datum ein
  async addDateToPlaceForTrip(place: Place, trip: Trip, date: string): Promise<void> {
    const userId = await this.requireUserId();
    const placeId = place.id;

    if (placeId) {
        const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
        const placeUsedIn = await this.getPlaceUsedIn(placeId);

        let updatedTrips = placeUsedIn.trips || [];
        const tripIndex = updatedTrips.findIndex(t => t.tripName === trip.name);
        
        if (tripIndex !== -1) {
            const trip = updatedTrips[tripIndex];
            if (!trip.plannedDates) {
                trip.plannedDates = [];
            }

            // Verhindert das Hinzufügen des gleichen Datums mehrmals
            if (!trip.plannedDates.includes(date)) {
                trip.plannedDates.push(date);
            }
        } 

        await updateDoc(placeDocRef, {
            used_in: {
                ...placeUsedIn,
                trips: updatedTrips
            }
        });

    }
  }

    // Entfernt ein bestimmtes Datum aus einer Reise für einen Ort
  async removeDateFromPlaceForTrip(place: Place, tripName: string, date: string): Promise<void> {
    const userId = await this.requireUserId();
    const placeId = place.id;

    if (placeId) {
        const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
        const placeUsedIn = await this.getPlaceUsedIn(placeId);

        let updatedTrips = placeUsedIn.trips || [];
        const tripIndex = updatedTrips.findIndex(trip => trip.tripName === tripName);

        if (tripIndex !== -1) {
            const trip = updatedTrips[tripIndex];

            if (trip.plannedDates) {
                trip.plannedDates = trip.plannedDates.filter(plannedDate => plannedDate !== date);
            }
        }
        await updateDoc(placeDocRef, {
            used_in: {
                ...placeUsedIn,
                trips: updatedTrips.length > 0 ? updatedTrips : []
            }
        });
    }
}

  // Holt Liste aller Speicherorte, in denen ein Place gespeichert ist
  async getPlaceTrips(placeId: string): Promise<string[]> {
    if(placeId){
      const usedIn = await this.getPlaceUsedIn(placeId);
      if (usedIn.trips) {
        return usedIn.trips.map(trip => trip.tripName);
      }
    }
    return [];
  }

  async isInWishlist(placeId: string): Promise<boolean> {
    const userId = await this.requireUserId();
    const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
    const placeDoc = await getDoc(placeDocRef);

    if (placeDoc.exists()) {
        const placeData = placeDoc.data() as Place;
        return placeData.used_in?.wishlist === true;
    }
    return false;
  }

  async addNewPlace(place: Place, used_in: string) {
    const userId = await this.requireUserId();

    const usedInObj: { wishlist?: boolean; trips?: { tripName: string; plannedDates?: string[] }[] } = {};

    if (used_in === "wishlist") {
        usedInObj.wishlist = true; 
    } else {
        usedInObj.trips = [{tripName: used_in, plannedDates: [] }]; 
    }
    const newPlace: Place = {
      name: place.name,
      id: place.id,
      lat: place.lat,
      lon: place.lon,
      kind: place.kind,
      used_in: usedInObj,
      ...(place.bbox && { bbox: place.bbox })
    };
    const placeDocRef = doc(this.firestore, `users/${userId}/places/${place.id}`);
    await setDoc(placeDocRef, newPlace);
    this.favUpdated.next();
  }

  async getTrips(): Promise<any[]> {
    const userId = await this.requireUserId();
    const tripCollection = collection(this.firestore, `users/${userId}/trips`);
    const tripsObservable = collectionData(tripCollection, { idField: 'id' }) as Observable<any[]>;
    return await firstValueFrom(tripsObservable);
  }

  async doesTripExist(name: string): Promise<boolean> {
    const trips = await this.getTrips(); 
    return trips.some(trip => trip.name === name);
  }

  async addTrip(tripname: string): Promise<string> {
    const userId = await this.requireUserId();
  
    const tripCollection = collection(this.firestore, `users/${userId}/trips`);
    const docRef = await addDoc(tripCollection, {});
    const tripData: Trip = {
      name: tripname,
      id: docRef.id as string, 
    };
  
    await setDoc(docRef, tripData);
    return tripData.id;
  }
  

  async updateTrip(oldTrip: Trip, updatedTrip: Partial<Trip>): Promise<void> {
    const userId = await this.requireUserId();
    const tripDocRef = doc(this.firestore, `users/${userId}/trips/${oldTrip.id}`);
    await updateDoc(tripDocRef, updatedTrip);
  
    // Orte speichern ihre Reisen über den Namen (used_in.trips[].tripName). Ändert sich der
    // Name, werden alle betroffenen Orte in einem writeBatch angepasst: Entweder werden alle
    // Änderungen gemeinsam gespeichert oder keine, sodass keine Orte auf alte Namen verweisen.
    if (oldTrip.name !== updatedTrip.name && updatedTrip.name) {
      const placesCollectionRef = collection(this.firestore, `users/${userId}/places`);
      
      const allPlacesSnapshot = await getDocs(placesCollectionRef);
      const batch = writeBatch(this.firestore);
      let updatedCount = 0;
      allPlacesSnapshot.forEach((docSnapshot) => {
        const placeData = docSnapshot.data() as Place;
  
        if (placeData.used_in?.trips) {
          const updatedTrips = placeData.used_in.trips.map(trip => 
            trip.tripName === oldTrip.name ? { ...trip, tripName: updatedTrip.name! } : trip
          );
  
          if (JSON.stringify(updatedTrips) !== JSON.stringify(placeData.used_in.trips)) {
            const placeDocRef = doc(this.firestore, `users/${userId}/places/${docSnapshot.id}`);
            batch.update(placeDocRef, { "used_in.trips": updatedTrips });
            updatedCount++;
          }
        }
      });
  
      if (updatedCount > 0) {
        await batch.commit();
      } 
    }
  }
  
  
  // Löscht einen Trip und entfernt ihn aus den zugehörigen Orten
  async deleteTrip(tripId: string): Promise<void> {
    const userId = await this.requireUserId();
    const tripDocRef = doc(this.firestore, `users/${userId}/trips/${tripId}`);
    const tripSnapshot = await getDoc(tripDocRef);
    const tripData = tripSnapshot.data();
    const tripName = tripData?.['name'];
    const places = await this.getPlacesForTrip(tripName);

    for (const place of places) {
        await this.deletePlace(place.id, tripName);
    }

    await deleteDoc(tripDocRef);
    this.favUpdated.next();
  }

  async getPlacesForTrip(tripName: string): Promise<Place[]> {
    const userId = await this.requireUserId();
    const placesCollection = collection(this.firestore, `users/${userId}/places`);
    const querySnapshot = await getDocs(placesCollection);

    const places: Place[] = querySnapshot.docs
        .map(doc => {
            const data = doc.data() as Place;
            data.id = doc.id; 
            return data;
        })
        .filter(place => 
            place.used_in?.trips?.some(t => t.tripName === tripName)
        );

    return places;
  }

  // Holt alle Trips aus Firestore und sortiert sie nach einer gewählten Option (Anzahl Orte, Datum oder Name)
  async getSortedTrips(sortOption: string): Promise<Trip[]> {
    const userId = await this.requireUserId();
    const tripCollection = collection(this.firestore, `users/${userId}/trips`);
    const tripSnapshot = await getDocs(tripCollection);
    let trips = tripSnapshot.docs.map(doc => doc.data() as Trip);
    if (sortOption === 'placeCount') {
      const placeCounts: { [tripName: string]: number } = {};
      for (const trip of trips) {
        placeCounts[trip.name] = await this.countPlacesForTrip(trip);
      }

      trips.sort((a, b) => (placeCounts[b.name] || 0) - (placeCounts[a.name] || 0));
    } else if (sortOption === 'dateRange') {
      trips.sort((a, b) => {
        const aStartDate = a.startDate ? new Date(a.startDate.split('.').reverse().join('-')) : undefined;
        const bStartDate = b.startDate ? new Date(b.startDate.split('.').reverse().join('-')) : undefined;
        return (aStartDate?.getTime() ?? 0) - (bStartDate?.getTime() ?? 0);
      });
    } else if (sortOption === 'name') {
      trips.sort((a, b) => a.name.localeCompare(b.name));
    }
    return trips;
  }


  async countPlacesForTrip(trip: Trip): Promise<number> {
    const places = await this.getPlacesForTrip(trip.name);
    return places.length;
  }  

  getLastAddedItem(): any {
    return this.localStorageService.getItem('lastAddedItem');
  }

  async presentAddToast(place: Place): Promise<void> {
    const lastAddedItem = this.getLastAddedItem();
  
    if (lastAddedItem===null) {
      this.openSavePlaceModal(place);  
    } 
    else {
      this.addPlacetoLastAddedItem(place);
      const message = lastAddedItem.type === 'trip' 
      ? `Hinzugefügt zu: ${lastAddedItem.data.name || 'Unbekannt'}` 
      : `Hinzugefügt zu: Merkliste`;

      const toast = await this.toastController.create({
        message: message,
        duration: 1500,
        color: 'secondary',
        buttons: [
          {
            text: 'Bearbeiten',
            handler: async () => {
              await this.deletePlaceFromLastAddedItem(place);
              this.openSavePlaceModal(place);   
            }
          }
        ]
      });
      toast.present();
    }
    this.favUpdated.next();
  }

  async presentDeleteToast(place: Place): Promise<void> {
    const placeInWishlist = await this.isInWishlist(place.id);
    const trips = await this.getPlaceTrips(place.id);
    const temPlace = place;

    if (placeInWishlist && trips.length === 0 || !placeInWishlist && trips.length === 1) {
        
        let deleteFrom = placeInWishlist ? 'wishlist' : trips[0];
        await this.deletePlace(place.id, deleteFrom);
        var addTo = deleteFrom;
        if(deleteFrom === 'wishlist'){
          deleteFrom = 'Merkliste';
        }
        const message = `Wurde aus ${deleteFrom} entfernt`;
        await this.showToast(message, 1500, 'secondary', 'Rückgängig', () => {
        this.addNewPlace(temPlace, addTo);
        this.openToastForAdding(temPlace, deleteFrom);
      });
    } else {
        await this.openSavePlaceModal(place);
    }
  }

  async openToastForAdding(temPlace: Place, deleteFrom: string) {
    const message = `Hinzugefügt zu: ${deleteFrom}`;
    await this.showToast(message, 1500, 'secondary', 'Bearbeiten', () => {
      this.deletePlace(temPlace.id, deleteFrom);
      this.openSavePlaceModal(temPlace);
    });
  }

  async showToast(
    message: string,
    duration: number,
    color: string,
    buttonText: string = '',
    buttonHandler?: () => void
  ) {
    const buttons = buttonText
      ? [
          {
            text: buttonText,
            handler: buttonHandler,
          },
        ]
      : [];

    const toast = await this.toastController.create({
      message,
      duration,
      color,
      buttons,
    });

    toast.present();
  }

  async addPlacetoLastAddedItem(place: Place): Promise<void> {
    const lastAddedItem = this.getLastAddedItem();
    if (lastAddedItem.type === 'trip') {
      const tripName =lastAddedItem.data.name;
      await this.addPlace(place, tripName);
    } else if (lastAddedItem.type === 'wishlist') {
      await this.addPlace(place, 'wishlist');
    }
  }

  async deletePlaceFromLastAddedItem(place: Place): Promise<void> {
    const lastAddedItem = this.getLastAddedItem();

    if (lastAddedItem.type === 'trip') {
      const tripName = lastAddedItem.data.name;
      await this.deletePlace(place.id, tripName);
    } else if (lastAddedItem.type === 'wishlist') {
      await this.deletePlace(place.id, 'wishlist');
    }
  }
  
  async openSavePlaceModal(place: Place): Promise<void> {
    const modal = await this.modalController.create({
        component: SavePlaceModalComponent, 
        componentProps: { place }
    });
    return await modal.present();
  }

  async getPlaceUsedIn(placeId: string): Promise<{ wishlist?: boolean; trips?: { tripName: string; plannedDates?: string[] }[] }> {
    const userId = await this.requireUserId();
    const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
    const placeDoc = await getDoc(placeDocRef);

    if (placeDoc.exists()) {
        const placeData = placeDoc.data() as Place;
        return placeData.used_in || {};
    }
    return {};
  }

  async doesPlaceExist(id: string): Promise<boolean> {
    const userId = await this.requireUserId();
    const placesCollectionRef = collection(this.firestore, `users/${userId}/places`);
    const placeQuery = query(placesCollectionRef, where('id', '==', id));
    const querySnapshot = await getDocs(placeQuery);
    return !querySnapshot.empty;
  }

  async getWishlist(): Promise<Place[]> {
    const userId = await this.requireUserId();
    const placesCollectionRef = collection(this.firestore, `users/${userId}/places`);
    const wishlistQuery = query(placesCollectionRef, where('used_in.wishlist', '==', true));
    return firstValueFrom(collectionData(wishlistQuery, { idField: 'id' }) as Observable<Place[]>);
  }
  
  async addUser(user:any) {
    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.id}`);
      const newUser: User = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        id: user.id, 
        createdAt: new Date(),
        profilePicture: 'assets/img/default.jpg',
      };

      await setDoc(userDocRef, newUser);
      return user.id; 
    }
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userDocRef, updates);
  }

  async getUserFirestore(): Promise<User | null> {
    const userId = await this.authService.getCurrentUserId();
    if (userId) {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data() as User;
      }
    }
    return null;
  }

  // Entfernt einen Ort aus der Merkliste oder einer Reise. Ist er danach nirgends mehr
  // gespeichert, wird das Dokument des Ortes ganz gelöscht.
  async deletePlace(placeId: string, used_in: string): Promise<void> {

    const userId = await this.requireUserId();
    if (placeId) {
      const placeDocRef = doc(this.firestore, `users/${userId}/places/${placeId}`);
      const placeDoc = await getDoc(placeDocRef);

      if (placeDoc.exists()) {
        const placeData = placeDoc.data() as Place;
        const usedIn = placeData.used_in || {};

        if (used_in === "wishlist") {
            if (usedIn.wishlist === true) {
                await updateDoc(placeDocRef, {
                    'used_in.wishlist': false
                });
            }
        } else {
            const trips = usedIn.trips || [];
            const tripIndex = trips.findIndex(trip => trip.tripName === used_in);

            if (tripIndex > -1) {
                trips.splice(tripIndex, 1);
                await updateDoc(placeDocRef, {
                    'used_in.trips': trips.length > 0 ? trips : []
                });

            }
        }

        const inWishlist = await this.isInWishlist(placeId);
        const emptyTrips = (await this.getPlaceTrips(placeId)).length === 0;
        
        if (!inWishlist && emptyTrips) {
            await deleteDoc(placeDocRef);
        }
      } 
    } 
    this.favUpdated.next();
  } 


  async getAvailablePlacesForDate(trip: Trip, date: string): Promise<Place[]> {
    const allPlaces = await this.getPlacesForTrip(trip.name);
    const availablePlaces = [];
    
    for (const place of allPlaces) {
      const isAlreadyAdded = await this.isPlaceForDateInTrip(place.id, trip, date);
      if (!isAlreadyAdded) {
        availablePlaces.push(place);
      }
    }
    return availablePlaces;
  }

  async isPlaceForDateInTrip(placeId: string, trip: Trip, date: string): Promise<boolean> {
    const placeUsedIn = await this.getPlaceUsedIn(placeId);
    if (placeUsedIn.trips) {
      const t = placeUsedIn.trips.find(t => t.tripName === trip.name);
      return t?.plannedDates?.includes(date) || false;
    }
    return false;
  }

  /**
   * Löscht alle Daten des angemeldeten Nutzers: Orte, Reisen und zuletzt das Nutzerdokument.
   * Fehlgeschlagene Löschungen werden bis zu dreimal wiederholt. Danach wird geprüft, ob
   * wirklich nichts übrig ist; andernfalls wird ein Fehler geworfen, damit das Konto
   * nicht gelöscht wird und der Nutzer es erneut versuchen kann.
   */
  async deleteUserData(): Promise<void> {
    const userId = await this.requireUserId();
    const subcollections = ['places', 'trips'];
    const maxAttempts = 3;

    for (const name of subcollections) {
      const colRef = collection(this.firestore, `users/${userId}/${name}`);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const snapshot = await getDocs(colRef);
        if (snapshot.empty) {
          break;
        }
        // Fehler einzelner Löschungen abfangen, damit die übrigen trotzdem ausgeführt werden.
        // Was übrig bleibt, wird im nächsten Durchlauf erneut versucht.
        await Promise.all(snapshot.docs.map(document => deleteDoc(document.ref).catch(() => undefined)));
      }

      const remaining = await getDocs(colRef);
      if (!remaining.empty) {
        throw new Error(`${remaining.size} Einträge in "${name}" konnten nicht gelöscht werden.`);
      }
    }

    // Das Nutzerdokument zuletzt löschen: Scheitert vorher etwas, bleibt das Profil
    // bestehen und der Nutzer kann die Löschung erneut anstoßen.
    await deleteDoc(doc(this.firestore, `users/${userId}`));
  }


}
