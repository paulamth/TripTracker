import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../model/user.interface';
import { LocalStorageService } from './local-storage.service';

// Grundlage: Firebase-Auth-Dokumentation, https://firebase.google.com/docs/auth?hl=de
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$!: Observable<any>;

  constructor(
    private auth: AngularFireAuth,
    private router: Router,
    private localStorageService: LocalStorageService) {
    this.user$ = this.auth.authState.pipe(
      map(user => {
        if (user) {
          return user;
        } else {
          this.localStorageService.clear();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2500);
          return null;
        }
      })
    );
  }

  getUser(): Promise<any> {
    return firstValueFrom(this.user$);
  }

  /**
   * Liefert die ID des angemeldeten Nutzers direkt aus Firebase Auth.
   * Bewusst nicht aus dem LocalStorage, weil sie dort im Browser veränderbar wäre.
   */
  async getCurrentUserId(): Promise<string | null> {
    const user = await firstValueFrom(this.auth.authState);
    return user ? user.uid : null;
  }

  async login(email: string, password: string): Promise<void> {
    await this.auth.signInWithEmailAndPassword(email, password);
    this.localStorageService.clear();
  }

  async register(email: string, password: string, firstname: string, lastname: string): Promise<User> {
    const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (!user) {
      throw new Error('Registrierung fehlgeschlagen!');
    }

    await user.updateProfile({
      displayName: firstname
    });

    return {
      firstname,
      lastname,
      email,
      id: user.uid,
      createdAt: new Date()
    };
  }

  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
      this.localStorageService.clear();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
    }
  }

  /**
   * Bestätigt die Identität erneut mit dem Passwort.
   * Firebase verlangt eine frische Anmeldung, bevor ein Konto gelöscht werden darf.
   */
  async reauthenticate(password: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Kein Benutzer angemeldet.');
    }
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  }

  /**
   * Löscht das Firebase-Konto. Die Firestore-Daten müssen vorher gelöscht sein,
   * denn danach erlauben die Security Rules keinen Zugriff mehr auf sie.
   */
  async deleteAccount(): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) {
      throw new Error('Kein Benutzer angemeldet.');
    }
    await user.delete();
    this.localStorageService.clear();
  }
}
