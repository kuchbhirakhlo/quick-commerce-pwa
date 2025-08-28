"use client"

// This file handles Firebase initialization on the client side only
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth as _getAuth, Auth, connectAuthEmulator } from "firebase/auth"
import { 
  getFirestore as _getFirestore, 
  Firestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  FirestoreSettings,
  onSnapshotsInSync,
  disableNetwork,
  enableNetwork
} from "firebase/firestore"
import { getStorage as _getStorage, FirebaseStorage } from "firebase/storage"

// Track initialization status
let isFirebaseInitialized = false
let isAuthInitialized = false
let isNetworkConnected = true // Track network connectivity
let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

// Debug logging function
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_FIREBASE === 'true') {
    console.log(`[Firebase Debug] ${message}`, ...args);
  }
};

// Check if Firebase config is valid
const isConfigValid = (config: any) => {
  return (
    config.apiKey && 
    config.apiKey !== "" && 
    config.projectId && 
    config.projectId !== ""
  )
}

// Function to initialize Firebase App only
export function initializeFirebaseApp() {
  // Only initialize once and only on the client side
  if (typeof window === "undefined") {
    return null
  }
  
  // Return existing app if already initialized
  if (isFirebaseInitialized && firebaseApp) {
    return firebaseApp
  }
  
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    firebaseApp = getApps()[0]
    isFirebaseInitialized = true
    debugLog("Firebase App already initialized, returning existing instance");
    return firebaseApp
  }

  try {
    debugLog("Initializing Firebase App...");
    
    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    }

    // Check if config is valid before initializing
    if (!isConfigValid(firebaseConfig)) {
      console.error(
        "Firebase configuration is invalid. Please check your environment variables or .env.local file. " +
        "You need to set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID, etc."
      )
      
      // Log specific missing values to help debugging
      console.error("Missing Firebase config values:", {
        apiKey: !firebaseConfig.apiKey,
        authDomain: !firebaseConfig.authDomain,
        projectId: !firebaseConfig.projectId
      });
      
      throw new Error("Firebase configuration is invalid. Please check your environment variables.");
    }

    // Initialize Firebase app
    debugLog("Firebase config is valid, initializing app with config:", {
      apiKey: firebaseConfig.apiKey ? "***" : undefined,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId
    });
    
    firebaseApp = initializeApp(firebaseConfig)
    isFirebaseInitialized = true
    console.log("Firebase App initialized successfully")
    
    // Automatically initialize auth right after app initialization
    // This helps prevent race conditions
    initializeFirebaseAuth()

    return firebaseApp
  } catch (error) {
    console.error("Error initializing Firebase App:", error)
    isFirebaseInitialized = false
    throw error;
  }
}

// Function to initialize Firebase Auth
export function initializeFirebaseAuth() {
  // Only initialize once, only on the client side, and only if Firebase App is initialized
  if (typeof window === "undefined") {
    return null
  }
  
  if (isAuthInitialized && auth) {
    return auth
  }

  const app = initializeFirebaseApp()
  if (!app) {
    console.error("Cannot initialize Firebase Auth: Firebase App not initialized")
    return null
  }

  try {
    debugLog("Initializing Firebase Auth...");
    auth = _getAuth(app)
    
    // Connect to auth emulator in development if configured
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
      const emulatorHost = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || 'localhost';
      const emulatorPort = process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || '9099';
      debugLog(`Connecting to Auth emulator at ${emulatorHost}:${emulatorPort}`);
      connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPort}`);
    }
    
    // Set persistence to LOCAL by default
    // This ensures the user stays logged in across browser sessions
    if (typeof window !== "undefined" && auth) {
      import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
        setPersistence(auth!, browserLocalPersistence)
          .then(() => {
            debugLog("Auth persistence set to LOCAL");
          })
          .catch((error) => {
            console.error("Error setting auth persistence:", error);
          });
      });
    }
    
    // Log auth state changes in development
    if (process.env.NODE_ENV === 'development') {
      auth.onAuthStateChanged((user) => {
        if (user) {
          debugLog("Auth state changed: User signed in", { 
            uid: user.uid,
            email: user.email,
            provider: user.providerData[0]?.providerId
          });
        } else {
          debugLog("Auth state changed: User signed out");
        }
      });
    }
    
    isAuthInitialized = true
    console.log("Firebase Auth initialized successfully")
    return auth
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error)
    isAuthInitialized = false
    return null
  }
}

// Function to initialize Firebase Firestore
export function initializeFirebaseFirestore() {
  if (typeof window === "undefined") {
    return null
  }

  if (db) {
    return db
  }

  const app = initializeFirebaseApp()
  if (!app) {
    console.error("Cannot initialize Firebase Firestore: Firebase App not initialized")
    return null
  }

  try {
    // Initialize Firestore with specific settings
    const firestore = _getFirestore(app);
    db = firestore;
    
    // Enable offline persistence with unlimited cache size
    if (typeof window !== 'undefined') {
      try {
        // Set persistence options
        const persistenceSettings: FirestoreSettings = {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        };
        
        // Try to enable multi-tab persistence first
        enableMultiTabIndexedDbPersistence(firestore)
          .then(() => {
            console.log("Multi-tab persistence enabled successfully");
            // Set up snapshot sync listener to monitor connection status
            const unsubscribe = onSnapshotsInSync(firestore, () => {
              console.log("Firestore snapshots in sync - connection is working");
              isNetworkConnected = true;
            });
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              // Multiple tabs open, fallback to single-tab persistence
              console.warn("Multiple tabs detected, falling back to single-tab persistence");
              return enableIndexedDbPersistence(firestore);
            } else if (err.code === 'unimplemented') {
              console.warn("IndexedDB persistence is not available in this browser");
            } else {
              console.error("Error enabling persistence:", err);
            }
            return Promise.reject(err);
          })
          .catch(persistenceError => {
            console.warn("Error setting up Firestore persistence:", persistenceError);
          });
      } catch (persistenceError) {
        console.warn("Error setting up Firestore persistence:", persistenceError);
      }
      
      // Monitor online/offline status
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          console.log("Browser went online - enabling Firestore network");
          if (db) enableNetwork(db).catch(err => console.error("Error enabling network:", err));
          isNetworkConnected = true;
        });
        
        window.addEventListener('offline', () => {
          console.log("Browser went offline - disabling Firestore network");
          if (db) disableNetwork(db).catch(err => console.error("Error disabling network:", err));
          isNetworkConnected = false;
        });
      }
    }
    
    console.log("Firebase Firestore initialized successfully")
    return db
  } catch (error) {
    console.error("Error initializing Firebase Firestore:", error)
    return null
  }
}

// Function to initialize Firebase Storage
export function initializeFirebaseStorage() {
  if (typeof window === "undefined") {
    return null
  }

  if (storage) {
    return storage
  }

  const app = initializeFirebaseApp()
  if (!app) {
    console.error("Cannot initialize Firebase Storage: Firebase App not initialized")
    return null
  }

  try {
    storage = _getStorage(app)
    console.log("Firebase Storage initialized successfully")
    return storage
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error)
    return null
  }
}

// Function to get Firebase Auth (will initialize if needed)
export function getAuth() {
  if (!auth) {
    auth = initializeFirebaseAuth()
  }
  return auth
}

// Function to get Firebase Firestore (will initialize if needed)
export function getFirestore() {
  if (!db) {
    db = initializeFirebaseFirestore()
  }
  return db
}

// Function to get Firebase Storage (will initialize if needed)
export function getStorage() {
  if (!storage) {
    storage = initializeFirebaseStorage()
  }
  return storage
}

// Check if Firestore is connected to the network
export function isFirestoreConnected() {
  return isNetworkConnected && db !== null;
}

// Function to retry a Firestore operation with exponential backoff
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait longer between each retry (exponential backoff)
      if (attempt > 0) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      return await operation();
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      // Immediately retry for specific errors that might be temporary
      if (error.code === 'unavailable' || 
          error.code === 'resource-exhausted' ||
          error.message?.includes('network') ||
          error.message?.includes('timeout')) {
        continue;
      }
      
      // For other errors, use the standard delay
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Operation failed after multiple retries');
}

// Initialize Firebase App immediately but only on client side
if (typeof window !== "undefined") {
  // Initialize Firebase immediately
  firebaseApp = initializeFirebaseApp()
  
  if (firebaseApp) {
    // Initialize services immediately
    auth = initializeFirebaseAuth()
    db = initializeFirebaseFirestore()
    storage = initializeFirebaseStorage()
  }
}

export { firebaseApp, auth, db, storage, isFirebaseInitialized, isAuthInitialized, isNetworkConnected }
