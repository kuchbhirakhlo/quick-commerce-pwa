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