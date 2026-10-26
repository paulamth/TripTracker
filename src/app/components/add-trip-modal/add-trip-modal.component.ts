import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from '../../services/firestore.service';


@Component({
  selector: 'app-add-trip-modal',
  templateUrl: './add-trip-modal.component.html',
  styleUrls: ['./add-trip-modal.component.scss'],
})
export class AddTripModalComponent {
  name: string = '';
  error: string = '';

  constructor(
    private firestoreService: FirestoreService, 
    private modalController: ModalController) 
    {}

  async closeModal() {
    this.modalController.dismiss();
  }

  async addTrip() {
    if (this.name.trim().length > 0) {

      const tripExists = await this.firestoreService.doesTripExist(this.name);
      if(!tripExists){

        await this.firestoreService.addTrip(this.name);
        this.name = '';
        this.error = '';
        this.modalController.dismiss({newTrip: true});
      }
      else{
        this.error = 'Diese Reise existiert bereits!';
        this.name = '';
      }
    }
    else{
      this.error ="Geben Sie einen Ort ein";
      return;
    }
  }

  clearError() {
    this.error = '';  
  }
  
}