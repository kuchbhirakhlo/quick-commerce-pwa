import { getAuth } from "./firebase-client"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from "firebase/auth"
import { db } from "./config"
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { VendorCredential, getVendorByPhone } from "./vendor-schema"
import { setVendorSessionCookies, clearVendorSessionCookies, setCookie } from "./set-session-cookie"

// Sign in with email/mobile and password specific for vendors
export const signInVendor = async (identifier: string, password: string) => {
  try {
    const auth = getAuth()
    if (!auth) {
      console.error("Firebase auth not initialized")

      // Check if we're in production or development
      if (process.env.NODE_ENV === 'production') {
        console.error("Firebase authentication failed in production environment");
        // Log any relevant environment information that might help diagnose the issue
        console.log("Project environment:", {
          hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        });
      }

      return {
        success: false,
        error: new Error("Firebase authentication not initialized. Please try again later or contact support.")
      }
    }

    // For development without Firebase, allow a test account
    if (process.env.NODE_ENV === 'development' && identifier === 'test@example.com' && password === 'password') {
      console.log('Using test vendor account in development mode')

      // Set session cookies for test account
      setVendorSessionCookies('test-vendor-id');
      setCookie('testMode', 'true', 7);

      // Return a successful login with test data
      return {
        success: true,
        user: { uid: 'test-vendor-id' },
        vendorData: {
          id: 'test-vendor-id',
          uid: 'test-vendor-id',
          name: 'Test Vendor',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          pincodes: ['123456'],
          role: 'vendor',
          status: 'active',
          productsCount: 0,
          joinedDate: new Date().toISOString(),
          profileComplete: true
        }
      }
    }

    // Determine if identifier is email or phone number
    const isEmail = identifier.includes('@');
    const isPhone = /^\d{10}$/.test(identifier.replace(/\D/g, ''));

    if (isEmail) {
      // Handle email login
      console.log("Attempting Firebase authentication with email:", identifier);
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password)
      const userUid = userCredential.user.uid

      console.log("User authenticated with Firebase, checking vendor status: ", userUid)

      // Check if Firestore is available
      if (!db) {
        console.error("Firestore not initialized, cannot verify vendor status");
        return {
          success: false,
          error: new Error("Database connection error. Please try again later.")
        };
      }

      // Check if user has vendor role - first try direct UID
      let vendorDoc = await getDoc(doc(db, "vendors", userUid))
      let vendorId = userUid

      // If not found, check for vendor with prefix pattern (created by admin)
      if (!vendorDoc.exists()) {
        console.log("Vendor not found by direct UID, checking vendor_ prefix")
        const vendorPrefixId = `vendor_${userUid}`
        vendorDoc = await getDoc(doc(db, "vendors", vendorPrefixId))
        if (vendorDoc.exists()) {
          vendorId = vendorPrefixId
        }
      }

      // If still no vendor doc, check by email as a last resort
      if (!vendorDoc.exists()) {
        console.log("Vendor not found by prefixed ID, trying to find by email")
        const vendorsQuery = query(
          collection(db, "vendors"),
          where("email", "==", identifier)
        )

        const querySnapshot = await getDocs(vendorsQuery)
        if (!querySnapshot.empty) {
          vendorDoc = querySnapshot.docs[0]
          vendorId = vendorDoc.id
          console.log("Found vendor by email with ID:", vendorId);
        } else {
          console.error("No vendor account found for user:", userUid, "with email:", identifier);
          throw new Error("No vendor account found for this user. Please contact support if you believe this is an error.")
        }
      }

      // Check if vendor is active
      const vendorData = vendorDoc.data() as VendorCredential
      console.log("Vendor status:", vendorData.status);

      if (vendorData.status === "blocked") {
        throw new Error("Your vendor account has been blocked. Please contact support.")
      }

      if (vendorData.status === "pending") {
        throw new Error("Your vendor account is pending approval. Please wait for admin approval.")
      }

      // Update last login timestamp
      try {
        await updateDoc(doc(db, "vendors", vendorId), {
          lastLogin: serverTimestamp()
        })
        console.log("Updated vendor last login timestamp");
      } catch (updateError) {
        // Don't fail login if just the timestamp update fails
        console.error("Failed to update last login timestamp:", updateError);
      }

      // Set session cookies for authenticated vendor
      setVendorSessionCookies(userUid, false);
      console.log("Set session cookies for vendor:", userUid);

      return {
        success: true,
        user: userCredential.user,
        vendorData: {
          id: vendorId,
          ...vendorData,
          uid: userUid, // Ensure Firebase UID is included and not overwritten
        }
      }
    } else if (isPhone) {
      // Handle mobile number login - find vendor by phone first
      console.log("Attempting login with mobile number:", identifier);

      // Find vendor by phone number
      const vendorData = await getVendorByPhone(identifier);
      if (!vendorData) {
        throw new Error("No vendor account found with this mobile number. Please contact support if you believe this is an error.")
      }

      console.log("Found vendor by phone:", vendorData.id);

      // Check if vendor is active
      if (vendorData.status === "blocked") {
        throw new Error("Your vendor account has been blocked. Please contact support.")
      }

      if (vendorData.status === "pending") {
        throw new Error("Your vendor account is pending approval. Please wait for admin approval.")
      }

      // For mobile login, we need to authenticate with email since Firebase Auth doesn't support phone as username
      // We'll use the email associated with the phone number
      if (!vendorData.email) {
        throw new Error("No email associated with this mobile number. Please contact support.")
      }

      console.log("Authenticating with associated email:", vendorData.email);
      const userCredential = await signInWithEmailAndPassword(auth, vendorData.email, password)
      const userUid = userCredential.user.uid

      // Update last login timestamp
      try {
        if (!vendorData.id) {
          throw new Error("Vendor ID is missing. Cannot update login timestamp.");
        }

        await updateDoc(doc(db, "vendors", vendorData.id), {
          lastLogin: serverTimestamp()
        })
        console.log("Updated vendor last login timestamp");
      } catch (updateError) {
        console.error("Failed to update last login timestamp:", updateError);
      }

      // Set session cookies for authenticated vendor
      setVendorSessionCookies(userUid, false);
      console.log("Set session cookies for vendor:", userUid);

      // Ensure we have a valid vendor ID for the response
      const vendorId = vendorData.id || (() => {
        throw new Error("Vendor ID is missing from vendor data");
      })();

      return {
        success: true,
        user: userCredential.user,
        vendorData: {
          id: vendorId,
          ...vendorData,
          uid: userUid,
        }
      }
    } else {
      throw new Error("Please enter a valid email address or 10-digit mobile number")
    }
  } catch (error: any) {
    console.error("Vendor sign-in error:", error)

    // Provide user-friendly error messages
    let errorMessage = "Failed to sign in. Please check your credentials."

    if (error.code === 'auth/invalid-credential') {
      errorMessage = "Invalid email/mobile or password"
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = "This account has been disabled"
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "No account found with this email"
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = "Incorrect password"
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Too many unsuccessful login attempts. Please try again later."
    } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/app-deleted' || error.code === 'auth/app-not-authorized') {
      errorMessage = "Authentication service is temporarily unavailable. Please try again later."
      console.error("Firebase configuration error:", error.code);
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: new Error(errorMessage)
    }
  }
}

// Sign out vendor
export const signOutVendor = async () => {
  try {
    const auth = getAuth()
    if (!auth) {
      return {
        success: false,
        error: new Error("Firebase authentication not initialized")
      }
    }

    // Clear session cookies
    clearVendorSessionCookies();

    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    console.error("Vendor sign-out error:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to sign out")
    }
  }
}

// Reset vendor password
export const resetVendorPassword = async (email: string) => {
  try {
    const auth = getAuth()
    if (!auth) {
      return {
        success: false,
        error: new Error("Firebase authentication not initialized")
      }
    }

    // Check if email belongs to a vendor
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("email", "==", email)
    )

    const querySnapshot = await getDocs(vendorsQuery)
    if (querySnapshot.empty) {
      return {
        success: false,
        error: new Error("No vendor account found with this email")
      }
    }

    await sendPasswordResetEmail(auth, email)

    return {
      success: true,
      message: "Password reset email sent. Please check your inbox."
    }
  } catch (error: any) {
    console.error("Password reset error:", error)

    let errorMessage = "Failed to send password reset email."

    if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email address"
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "No account found with this email"
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: new Error(errorMessage)
    }
  }
}

// Get current vendor data
export const getCurrentVendorData = async () => {
  try {
    const auth = getAuth()
    if (!auth || !auth.currentUser) {
      return { success: false, error: new Error("No authenticated vendor") }
    }

    const userUid = auth.currentUser.uid

    // First try direct UID
    let vendorDoc = await getDoc(doc(db, "vendors", userUid))

    // If not found, check for vendor with prefix pattern
    if (!vendorDoc.exists()) {
      const vendorPrefixId = `vendor_${userUid}`
      vendorDoc = await getDoc(doc(db, "vendors", vendorPrefixId))
    }

    // If still no vendor doc, check by email as a last resort
    if (!vendorDoc.exists()) {
      const vendorsQuery = query(
        collection(db, "vendors"),
        where("email", "==", auth.currentUser.email),
        where("uid", "==", userUid)
      )

      const querySnapshot = await getDocs(vendorsQuery)
      if (!querySnapshot.empty) {
        vendorDoc = querySnapshot.docs[0]
      } else {
        return { success: false, error: new Error("No vendor account found for this user") }
      }
    }

    const vendorData = vendorDoc.data() as VendorCredential

    return {
      success: true,
      vendorData: {
        id: vendorDoc.id,
        ...vendorData
      } as VendorCredential
    }
  } catch (error: any) {
    console.error("Error getting current vendor data:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to get vendor data")
    }
  }
} 