import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function getFirebaseAuth() {
  return getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig));
}
