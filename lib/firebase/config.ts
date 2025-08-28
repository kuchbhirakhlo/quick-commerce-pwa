import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if all required Firebase config variables are set
const isFirebaseConfigValid = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Check if Firebase Storage is properly configured
const isFirebaseStorageConfigured = () => {
  return !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
};

// Log a warning if Firebase config is missing
if (typeof window !== 'undefined' && !isFirebaseConfigValid()) {
  console.error(
    "Firebase configuration is incomplete. Please check your environment variables.",
    {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  );
}

// Log a warning if Firebase Storage bucket is missing
if (typeof window !== 'undefined' && !isFirebaseStorageConfigured()) {
  console.error(
    "Firebase Storage bucket is not configured. File uploads will not work.",
    {
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }
  );
}

// Authentication configuration
export const AUTH_CONFIG = {
  // Phone authentication settings
  ENABLE_PHONE_AUTH: true,
  DAILY_OTP_LIMIT: 5,
  OTP_USAGE_STORAGE_KEY: 'otp_usage',
  OTP_LIMIT_MESSAGE: 'Daily OTP limit reached. Please try again tomorrow.',
  
  // Google authentication settings (disabled)
  ENABLE_GOOGLE_AUTH: false,
  
  // Debug settings
  DEBUG_AUTH: process.env.NODE_ENV === 'development',
  
  // Domain settings for reCAPTCHA
  // The list of domains that should be considered valid for reCAPTCHA verification
  // This is useful for development environments where the hostname might not match the Firebase auth domain
  ALLOWED_DOMAINS: [
    'localhost', 
    '127.0.0.1',
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.split('.')[0] || '',
    process.env.NEXT_PUBLIC_SITE_DOMAIN || ''
  ]
}

// Export Firebase config for use in other files
export const getFirebaseConfig = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
};

// Initialize Firebase
let app: any
let auth: any
let db: any
let storage: any

try {
  if (isFirebaseConfigValid()) {
    app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    // Log storage bucket information
    if (typeof window !== 'undefined' && app) {
      console.log("Firebase Storage bucket:", app.options.storageBucket || 'Not configured');
    }
  } else {
    throw new Error("Firebase configuration is invalid. Please check your environment variables.")
  }
} catch (error) {
  if (typeof window !== 'undefined') {
    console.error("Error initializing Firebase:", error)
    throw new Error("Failed to initialize Firebase. Check your configuration.")
  }
}

// Connect to emulators in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099')
//   connectFirestoreEmulator(db, 'localhost', 8080)
//   connectStorageEmulator(storage, 'localhost', 9199)
// }

export { app, auth, db, storage, isFirebaseStorageConfigured }
