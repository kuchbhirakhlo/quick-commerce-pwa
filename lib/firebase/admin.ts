import { db } from "./config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore"
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

// Constants
const GLOBAL_SETTINGS_DOC_ID = "global_settings"

// Get all available pincodes defined by admin
export const getGlobalPincodes = async (): Promise<string[]> => {
  try {
    const docRef = doc(db, "settings", GLOBAL_SETTINGS_DOC_ID)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists() && docSnap.data().pincodes) {
      return docSnap.data().pincodes as string[]
    } else {
      // Initialize with default pincodes if none exist
      const defaultPincodes = ["110001", "110002", "110003"]
      await setDoc(docRef, {
        pincodes: defaultPincodes,
        updatedAt: serverTimestamp()
      })
      return defaultPincodes
    }
  } catch (error) {
    console.error("Error getting global pincodes:", error)
    return ["110001"] // Return at least one default pincode
  }
}

// Add a new pincode to the global list
export const addGlobalPincode = async (pincode: string): Promise<boolean> => {
  try {
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      throw new Error("Invalid pincode format")
    }

    const docRef = doc(db, "settings", GLOBAL_SETTINGS_DOC_ID)
    await updateDoc(docRef, {
      pincodes: arrayUnion(pincode),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error("Error adding global pincode:", error)
    return false
  }
}

// Remove a pincode from the global list
export const removeGlobalPincode = async (pincode: string): Promise<boolean> => {
  try {
    const docRef = doc(db, "settings", GLOBAL_SETTINGS_DOC_ID)
    await updateDoc(docRef, {
      pincodes: arrayRemove(pincode),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error("Error removing global pincode:", error)
    return false
  }
}

// Firebase Admin initialization
let adminApp: any = null

export const initFirebaseAdmin = async () => {
  try {
    if (adminApp) {
      return adminApp
    }

    // Check if required Firebase Admin config is available
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.error("Firebase Admin not configured - missing FIREBASE_SERVICE_ACCOUNT_KEY")
      return null
    }

    // Parse service account key
    let serviceAccount
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    } catch (error) {
      console.error("Invalid Firebase service account key format")
      return null
    }

    // Initialize Firebase Admin
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      })
    } else {
      adminApp = getApp()
    }

    return adminApp
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error)
    return null
  }
}

// Export Firebase Admin messaging instance
export const getAdminMessaging = async () => {
  try {
    const app = await initFirebaseAdmin()
    if (!app) {
      return null
    }
    return getMessaging(app)
  } catch (error) {
    console.error("Error getting Firebase Admin messaging:", error)
    return null
  }
}
