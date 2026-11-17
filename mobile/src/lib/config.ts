const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function getConfigurationError(): string | null {
  if (!apiUrl || !/^https?:\/\/[^/\s]+/.test(apiUrl)) {
    return 'Set EXPO_PUBLIC_API_URL in mobile/.env to your FM Tracker server URL.';
  }
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    return 'Add your existing Firebase public configuration to mobile/.env, then restart Expo.';
  }
  return null;
}

export function getApiUrl(): string {
  if (!apiUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  return apiUrl;
}

export function assetUrl(path: string | null | undefined): string | undefined {
  return path ? new URL(path, `${getApiUrl()}/`).toString() : undefined;
}
