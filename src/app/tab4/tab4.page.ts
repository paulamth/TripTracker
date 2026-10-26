import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { User } from '../model/user.interface';
import { Timestamp } from 'firebase/firestore';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit {

  user: User | null = null;
  private isDeleting = false;

  constructor(
    private authService: AuthService, 
    private firestoreService:FirestoreService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController)
    {}

  async ngOnInit() {
    this.user = await this.getUserData();
  }

  async getUserData(): Promise<User | null> {
    try {
      const user = await this.firestoreService.getUserFirestore();
      
      if (user !== null && user.createdAt instanceof Timestamp) {
        user.createdAt = user.createdAt.toDate();
      }
      return user;

    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
      return null;
    }
  }
  
  // Galeriezugriff nach der Ionic-Dokumentation: https://ionicframework.com/docs/native/camera
  async selectImageFromGallery() {
    try {
      const image = await Camera.getPhoto({
        // Klein halten: Das Bild wird als Data-URL im Nutzerdokument gespeichert (Limit 1 MB)
        quality: 60,
        width: 400,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos 
      });
      if(this.user && this.user.id){
        this.user.profilePicture = image.dataUrl;
        await this.firestoreService.updateUser(this.user.id, { profilePicture: this.user.profilePicture });
      }
    
    } catch (error) {
      console.error('Fehler beim Zugriff auf die Galerie:', error);
    }
  }

  async logout(){
    this.authService.logout();
    this.navCtrl.navigateRoot('/login'); 
  }

  async deleteProfile() {
    const alert = await this.alertController.create({
      header: 'Konto löschen',
      message: 'Möchten Sie wirklich Ihr Konto löschen? Alle Daten werden unwiderruflich entfernt. Bitte geben Sie zur Bestätigung Ihr Passwort ein.',
      cssClass: 'delete-account-alert',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Passwort',
          attributes: { autocomplete: 'current-password' }
        }
      ],
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel'
        },
        {
          text: 'Löschen',
          cssClass: 'danger-button',
          handler: (data: { password?: string }) => {
            if (!data.password) {
              // Bei leerem Feld bleibt der Dialog offen (return false) und zeigt den Hinweis selbst an.
              alert.message = 'Alle Daten werden unwiderruflich entfernt. Bitte geben Sie Ihr Passwort ein, um das Löschen zu bestätigen.';
              return false;
            }
            this.deleteAccountAndData(data.password);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ablauf: 1. Passwort bestätigen, 2. alle Firestore-Daten löschen, 3. Firebase-Konto löschen.
   * Das Konto wird nur gelöscht, wenn die Daten vollständig entfernt wurden. So bleiben
   * keine Daten ohne Konto zurück, auf die niemand mehr zugreifen oder sie löschen könnte.
   */
  private async deleteAccountAndData(password: string) {
    // Schutz gegen doppeltes Auslösen, solange ein Löschvorgang läuft
    if (this.isDeleting) {
      return;
    }
    this.isDeleting = true;

    const loading = await this.loadingController.create({ message: 'Konto wird gelöscht …' });
    await loading.present();

    try {
      try {
        await this.authService.reauthenticate(password);
      } catch (error: any) {
        const wrongPassword = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials']
          .includes(error?.code);
        await this.showToast(
          wrongPassword ? 'Das Passwort ist nicht korrekt.' : 'Die Anmeldung konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.',
          'danger');
        return;
      }

      try {
        await this.firestoreService.deleteUserData();
      } catch (error) {
        console.error('Löschen der Benutzerdaten fehlgeschlagen:', error);
        await this.showToast('Ihre Daten konnten nicht vollständig gelöscht werden. Ihr Konto bleibt bestehen, bitte versuchen Sie es erneut.', 'danger');
        return;
      }

      try {
        await this.authService.deleteAccount();
      } catch (error) {
        console.error('Löschen des Kontos fehlgeschlagen:', error);
        await this.showToast('Ihre Daten wurden gelöscht, das Konto selbst aber nicht. Bitte versuchen Sie es erneut.', 'danger');
        return;
      }

      await this.showToast('Ihr Konto und alle Daten wurden gelöscht.', 'success');
      this.navCtrl.navigateRoot('/login');
    } finally {
      this.isDeleting = false;
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({ message, color, duration: 3500, position: 'bottom' });
    await toast.present();
  }
}
