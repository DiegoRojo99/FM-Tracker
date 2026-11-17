import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function getFirebaseAuth() {
  if (getApps().length) return getAuth(getApp());
  const app = initializeApp(firebaseConfig);
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
