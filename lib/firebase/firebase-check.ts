"use client"

import { useEffect } from "react"
import { firebaseApp, auth, db, storage } from "./firebase-client"

export function useFirebaseCheck() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Firebase app initialized:", !!firebaseApp)
      console.log("Firebase auth initialized:", !!auth)
      console.log("Firebase firestore initialized:", !!db)
      console.log("Firebase storage initialized:", !!storage)
    }
  }, [])
}
