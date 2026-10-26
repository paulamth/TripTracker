// Vorlage für die lokale Konfiguration.
// Kopieren nach environment.ts und environment.prod.ts (dort production: true) und
// eigene Werte eintragen. Beide Dateien sind per .gitignore vom Repository ausgeschlossen.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  },
  geoapifyApiKey: 'YOUR_GEOAPIFY_API_KEY',
  opentripmapApiKey: 'YOUR_OPENTRIPMAP_API_KEY',
  weatherApiKey: 'YOUR_WEATHERAPI_KEY'
};
