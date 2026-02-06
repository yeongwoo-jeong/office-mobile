import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBM0VwJOhE4dKWZCMqqQbxn6OFzKDGBV7U',
  authDomain: 'office-quest-e7d38.firebaseapp.com',
  databaseURL: 'https://office-quest-e7d38-default-rtdb.firebaseio.com',
  projectId: 'office-quest-e7d38',
  storageBucket: 'office-quest-e7d38.firebasestorage.app',
  messagingSenderId: '588391233335',
  appId: '1:588391233335:web:f7c6a62a46af7381628cb2',
  measurementId: 'G-NG0M9FHB9C',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
