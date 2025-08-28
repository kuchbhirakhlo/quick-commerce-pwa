#!/usr/bin/env node

import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import * as readline from "readline"

// Create readline interface for input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Function to prompt for input
function promptInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  console.log("=== Create Admin User ===")
  
  // Get Firebase config from environment or prompt for it
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || await promptInput("Firebase API Key: ")
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || await promptInput("Firebase Auth Domain: ")
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || await promptInput("Firebase Project ID: ")
  
  // Initialize Firebase
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
  }
  
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  
  // Get admin details
  const email = await promptInput("Admin Email: ")
  const password = await promptInput("Admin Password: ")
  
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Add user to admins collection
    await setDoc(doc(db, "admins", user.uid), {
      email: user.email,
      uid: user.uid,
      role: "admin",
      createdAt: new Date().toISOString(),
    })
    
    console.log(`Admin user created successfully! UID: ${user.uid}`)
  } catch (error: any) {
    console.error("Error creating admin user:", error.message)
  } finally {
    rl.close()
    // Force exit because Firebase keeps connections open
    setTimeout(() => process.exit(0), 1000)
  }
}

main() 