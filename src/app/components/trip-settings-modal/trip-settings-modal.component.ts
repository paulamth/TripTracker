import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { Trip } from 'src/app/model/trip.interface';
import { FirestoreService } from 'src/app/services/firestore.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-trip-settings-modal',
  templateUrl: './trip-settings-modal.component.html',
  styleUrls: ['./trip-settings-modal.component.scss'],
})

export class TripSettingsModalComponent implements OnInit {
  @Input() trip!: Trip;
  dateRange: string = '';
  newName: string ='';
  error: string = '';
  selectedDates: string[] = [];
  startDate: string | null = null;
  endDate: string | null = null;
  errorMessage: string = '';

  constructor(
    private modalController: ModalController, 
    private firestoreService: FirestoreService, 
    private router: Router,
    private alertController: AlertController,
    private localStorageService: LocalStorageService) 
    { 
    }

  ngOnInit() {
    if (this.trip.startDate && this.trip.endDate) {
      this.selectedDates = [this.formatDateToISO(this.trip.startDate), this.formatDateToISO(this.trip.endDate)];
    }
  }

  onDateChange(event: any) {
    const dates = event.detail.value;

    if (dates.length > 2) {
      // Begrenze die Auswahl auf die ersten zwei Daten
      this.selectedDates = dates.slice(0, 2);
    } else {
      this.selectedDates = dates;
    }

    if (this.selectedDates.length === 2) {
      // Sortiere die Daten sicherheitshalber
      const [firstDate, secondDate] = this.selectedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      this.startDate = firstDate;
      this.endDate = secondDate;

      // Prüfe, ob der erste Termin vor dem zweiten liegt
      if (new Date(this.startDate).getTime() > new Date(this.endDate).getTime()) {
        this.errorMessage = 'Das erste ausgewählte Datum muss vor dem zweiten Datum liegen.';
        this.selectedDates = []; 
        this.startDate = null;
        this.endDate = null;
      } else {
        this.errorMessage = '';
      }
    } else {
      this.startDate = this.selectedDates[0] || null;
      this.endDate = null;
      this.errorMessage = '';
    }

    if(this.startDate && this.endDate){
      this.startDate = this.formatDate(this.startDate);
      this.endDate = this.formatDate(this.endDate);
    }
  }

  formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  }

  formatDateToISO(date: string): string {
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
  }
  
  dismiss() {
    this.modalController.dismiss();
  }

  async saveChanges() {
   
    if(await this.firestoreService.doesTripExist(this.newName)){
      this.error = 'Diese Reise existiert bereits!';
      return;
    }

    if (this.newName==='') {
      this.newName = this.trip.name;
    }
  
    const updatedTrip:  Partial<Trip> = {
      name: this.newName,
      id: this.trip.id,
      startDate: this.startDate || '',
      endDate: this.endDate || '',
      description: this.trip.description || ''
    }

    if (this.trip.id) {
      try {
        if (this.newName !== this.trip.name) {  
          this.localStorageService.removeItem('lastAddedItem');
        } 
    
        await this.firestoreService.updateTrip(this.trip, updatedTrip);
        await this.modalController.dismiss({ updatedTrip });
        
      } catch (error) {
        console.error('Fehler beim Updaten des Trips', error);
      }
    }
  }

  async deleteTrip() {
    const alert = await this.alertController.create({
      header: 'Reise löschen',
      message: 'Möchten Sie wirklich diese Reise löschen? Alle Daten werden unwiderruflich entfernt.',
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel'
        },
        {
          text: 'Löschen',
          handler: async () => {
            try {
              if (this.trip.id) {
                await this.firestoreService.deleteTrip(this.trip.id);
                this.localStorageService.removeItem('lastAddedItem');
                this.router.navigate(["/tabs/tab3"]);
                this.dismiss();
              }
            } catch (error) {
              console.error('Fehler beim Löschen der Reise', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
