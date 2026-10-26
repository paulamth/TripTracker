import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, take } from 'rxjs';

/**
 * Lässt die App-Seiten nur für angemeldete Nutzer zu, sonst Weiterleitung zur Anmeldung.
 * Die eigentliche Datensicherheit leisten die Firestore Security Rules. Der Guard sorgt
 * dafür, dass Nicht-Angemeldete gar nicht erst auf Seiten ohne Daten landen.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AngularFireAuth);
  const router = inject(Router);

  return auth.authState.pipe(
    take(1),
    map(user => (user ? true : router.createUrlTree(['/login'])))
  );
};
