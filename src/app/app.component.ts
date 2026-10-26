import { Component } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { AuthService } from './services/auth.service';
// Swiper als Custom Element registrieren (Bild-Slider auf der Startseite)
register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  user: any;

  constructor(private authService: AuthService) {
    this.authService.getUser().then(user => {
      this.user = user;
    });
  }
}
