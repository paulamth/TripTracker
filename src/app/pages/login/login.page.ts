import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})


export class LoginPage {

  email!: string;
  password!: string;
  error!: string;

  constructor(
    private authService:AuthService,  
    private router: Router)
    {}

  async login() {
    try {
      await this.authService.login(this.email, this.password);

      this.router.navigate(['/tabs/tab1']);
      this.resetAll();
    } catch (error) {
      this.error = 'Ungültige Anmeldedaten!'
    }
  }


  async register() {
    this.resetAll();
    this.router.navigate(['register']);
  }

  resetError() {
    this.error = '';
  }

  resetAll(){
    this.email = '';
    this.password = '';
    this.error = '';
  }
}