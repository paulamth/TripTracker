import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import {provideHttpClient } from  '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {AngularFireModule} from '@angular/fire/compat';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';

import { environment } from 'src/environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, FirestoreModule } from '@angular/fire/firestore'

@NgModule({
  declarations: [AppComponent],
  imports: [FirestoreModule, BrowserModule, IonicModule.forRoot(), IonicModule, AppRoutingModule, FormsModule, AngularFireModule,AngularFireAuthModule,AngularFireModule.initializeApp(environment.firebase)],
  providers: [provideFirebaseApp(() => initializeApp(environment.firebase)),
              provideFirestore(() => getFirestore()),
              {provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
              ,provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule {}

