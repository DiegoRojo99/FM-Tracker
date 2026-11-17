import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// Firebase's native runtime exports this helper, but its shared public declarations omit it.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
