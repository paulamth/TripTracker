import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/model/user.interface';
import { AuthService } from 'src/app/services/auth.service';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  firstname = '';
  lastname = '';
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private router: Router
  ) { }


  async login() {
    this.clearError();
    this.router.navigate(["login"]);
  }

  async register() {
    this.clearError();

    if (this.validateFormat()) {
      try {
        const userCredential = await this.authService.register(this.email, this.password, this.firstname, this.lastname);
        const user = userCredential as User;
        await this.firestoreService.addUser(user);
        this.router.navigate(['login']);
      } catch (error) {
        this.error = 'Registrierung fehlgeschlagen, bitte versuchen Sie es erneut!';
      }
    }
  }

  validateFormat(): boolean {
    let errorMessage = '';

    if (this.firstname === '' || this.lastname === '' || this.email === '' || this.password === '') {
      errorMessage = 'Bitte füllen Sie alle Felder aus!';
    } else if (!this.validateEmail()) {
      errorMessage = 'Ungültiges E-Mail-Format!';
    } else if (this.password.length < 6) {
      errorMessage = 'Passwort muss mind. 6 Zeichen lang sein!';
    }

    this.error = errorMessage;
    return errorMessage === '';
  }

  validateEmail() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(this.email);
  }

  clearError() {
    this.error = ''; 
  }
}
