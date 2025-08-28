"use client"

import { getAuth } from "firebase/auth"
import { doc, getDoc, Firestore } from "firebase/firestore"
import { db } from "../firebase/firebase-client"

// Check if the current user is an admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user || !db) {
      return false
    }

    // Check if user exists in the admins collection
    const adminDoc = await getDoc(doc(db as Firestore, "admins", user.uid))
    return adminDoc.exists()
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Custom hook to handle admin authentication
export const createAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { createUserWithEmailAndPassword } = await import("firebase/auth")
    const auth = getAuth()

    if (!db) {
      return { success: false, error: "Firebase Firestore is not initialized" }
    }

    // Create the user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Add the user to the admins collection
    const { setDoc } = await import("firebase/firestore")
    await setDoc(doc(db as Firestore, "admins", user.uid), {
      email: user.email,
      uid: user.uid,
      role: "admin",
      createdAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error creating admin:", error)
    return { 
      success: false, 
      error: error.message || "Failed to create admin user" 
    }
  }
} 