"use client"

import { getAuth, signInWithPhoneNumber as firebaseSignInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect } from "firebase/auth"
import { initializeFirebaseApp } from "./firebase-client"
import { isAuthInitialized } from "./firebase-client"
import { AUTH_CONFIG } from "./config"

// Get auth instance
const app = initializeFirebaseApp()
const auth = app ? getAuth(app) : null

// Initialize recaptcha verifier
export const initRecaptchaVerifier = async (containerId: string) => {
  if (typeof window === "undefined") {
    throw new Error("RecaptchaVerifier can only be initialized on the client side")
  }

  // Wait for Auth to be initialized
  if (!isAuthInitialized) {
    console.log("Waiting for Auth to initialize before creating RecaptchaVerifier...")
    try {
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (isAuthInitialized) {
            clearInterval(checkInterval)
            resolve(true)
          }
        }, 100)
        
        // Set a timeout to avoid waiting indefinitely
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error("Auth initialization timeout"))
        }, 10000) // 10 seconds timeout
      })
    } catch (error) {
      console.error("Auth initialization timed out:", error)
      throw new Error("Firebase authentication service is unavailable. Please try again later.")
    }
  }

  try {
    if (!auth) {
      throw new Error("Auth is not initialized")
    }
    
    // Clean up any existing recaptcha verifiers
    const existingRecaptchas = document.querySelectorAll('.grecaptcha-badge, .grecaptcha-logo, div[class^="grecaptcha-"]');
    existingRecaptchas.forEach(element => {
      element.remove();
    });
    
    // Also remove any hidden recaptcha iframes
    const iframes = document.querySelectorAll('iframe[src*="recaptcha"], iframe[title*="recaptcha"]');
    iframes.forEach(element => {
      element.remove();
    });
    
    // Remove any reCAPTCHA scripts to ensure a clean slate
    const scripts = document.querySelectorAll('script[src*="recaptcha"]');
    scripts.forEach(element => {
      element.remove();
    });

    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }
    
    // Ensure the container is visible and has dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn("reCAPTCHA container has zero dimensions, adjusting...");
      container.style.width = "100%";
      container.style.height = "80px";
      container.style.display = "block";
      
      // Force a reflow to ensure styles are applied
      container.getBoundingClientRect();
    }

    // Log debug information about the environment
    console.log("Current hostname:", window.location.hostname);
    console.log("Firebase auth domain:", auth.app.options.authDomain);
    console.log("Using recaptcha size:", process.env.NODE_ENV === "development" ? "normal" : "invisible");

    // Create a new RecaptchaVerifier instance with better error handling
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "normal", // Always use normal size for better visibility
      callback: (response: any) => {
        console.log("Recaptcha verified", response ? "with response" : "without response")
      },
      "expired-callback": () => {
        console.log("Recaptcha expired, refreshing...")
        // Force refresh the recaptcha
        if (verifier) {
          try {
            verifier.clear();
            verifier.render();
          } catch (e) {
            console.error("Error refreshing expired reCAPTCHA:", e);
          }
        }
      },
      "error-callback": (error: any) => {
        console.error("reCAPTCHA encountered an error:", error);
      }
    });
    
    // Wait a brief moment before rendering to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Render the recaptcha to ensure it's ready
    try {
      await verifier.render();
      console.log("reCAPTCHA rendered successfully");
    } catch (renderError) {
      console.error("Error rendering reCAPTCHA:", renderError);
      
      // Try one more time with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await verifier.render();
        console.log("reCAPTCHA rendered successfully on second attempt");
      } catch (secondRenderError) {
        console.error("Failed to render reCAPTCHA on second attempt:", secondRenderError);
        throw new Error("Could not initialize verification. Please refresh the page and try again.");
      }
    }
    
    return verifier;
  } catch (error: any) {
    console.error("Error initializing RecaptchaVerifier:", error)
    
    // Add specific error handling for hostname validation issues
    if (error.message && error.message.includes("hostname")) {
      console.error("Hostname validation error detected");
      console.error("Current hostname:", window.location.hostname);
      console.error("Expected Firebase auth domain:", auth?.app?.options?.authDomain);
      throw new Error("Domain verification failed. Please ensure your domain is authorized in the Firebase console.");
    }
    
    // Check for network issues
    if (error.message && (error.message.includes("network") || error.message.includes("connection"))) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }
    
    // Handle other common errors
    if (error.message && error.message.includes("RecaptchaVerifier")) {
      throw new Error("Verification service failed to initialize. Please refresh the page and try again.");
    }
    
    throw error
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    console.log("Starting Google sign-in process...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Auth emulator enabled:", process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true");
    
    if (!auth) {
      console.error("Auth is not initialized, attempting to initialize it now");
      const authInstance = initializeFirebaseApp();
      if (!authInstance) {
        console.error("Failed to initialize Firebase app");
        return { success: false, error: new Error("Authentication service is not available. Please try again later.") };
      }
    }

    // Double check auth is available
    if (!auth) {
      console.error("Auth is still not initialized after initialization attempt");
      return { success: false, error: new Error("Authentication service is not available. Please try again later.") };
    }

    // DEVELOPMENT WORKAROUND: Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === "development";
    const useAuthEmulator = process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true";
    
    console.log("Using development mode:", isDevelopment);
    console.log("Using auth emulator:", useAuthEmulator);
    
    if (isDevelopment || useAuthEmulator) {
      console.log("Using development auth workaround - bypassing Firebase Google auth");
      
      // Create a mock user
      const mockUser = {
        uid: "dev-google-user-" + Date.now(),
        phoneNumber: null,
        displayName: "Dev User",
        email: "dev.user@example.com",
        photoURL: "https://via.placeholder.com/150",
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };
      
      // Store the mock user in localStorage to simulate being signed in
      localStorage.setItem("dev-auth-user", JSON.stringify(mockUser));
      
      // Trigger a storage event to notify other tabs/components
      window.dispatchEvent(new Event("storage"));
      
      console.log("Mock user created:", mockUser);
      
      return { success: true, user: mockUser };
    }

    // PRODUCTION: Use actual Firebase authentication
    console.log("Creating Google auth provider...");
    const provider = new GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Always prompt for account selection for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("Initiating Google sign-in...");
    
    // Check if we're in a mobile browser
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Device detection - Mobile:", isMobile);
    
    // Add a slight delay to ensure the browser is ready to show the popup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try popup method first for desktop, redirect for mobile
    if (!isMobile) {
      try {
        console.log("Attempting sign-in with popup...");
        
        // Check if Firebase is properly initialized
        if (!isAuthInitialized) {
          console.warn("Auth not fully initialized yet, waiting briefly before proceeding...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Ensure auth is still available
        if (!auth) {
          throw new Error("Auth became unavailable");
        }
        
        // Skip the popup blocker check as it might be causing issues
        // Instead, try the popup directly and handle any errors
        console.log("Attempting sign-in popup directly");
        
        const result = await signInWithPopup(auth, provider);
        
        // Get the Google OAuth access token
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        
        // The signed-in user info
        const user = result.user;
        
        console.log("User successfully authenticated with Google:", user.displayName);
        
        // Force refresh the auth state
        await auth.updateCurrentUser(user);
        
        return { 
          success: true, 
          user: result.user,
          token: token
        }
      } catch (popupError: any) {
        console.error("Popup sign-in failed:", popupError);
        console.error("Error code:", popupError.code);
        console.error("Error message:", popupError.message);
        
        // Check if this is our custom popup blocker error
        if (popupError.message === "popup_blocked_by_browser" || 
            popupError.code === 'auth/popup-closed-by-user' || 
            popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log("Popup was blocked or closed, trying redirect method instead...");
          // Fall through to redirect method
        } else {
          // For other errors, re-throw
          throw popupError;
        }
      }
    }
    
    // Use redirect method as fallback or for mobile
    console.log("Using redirect method for authentication...");
    
    // Check if we're coming back from a redirect
    try {
      // Ensure auth is still available
      if (!auth) {
        throw new Error("Auth became unavailable");
      }
      
      const result = await getRedirectResult(auth);
      
      if (result) {
        // User has been redirected back after authentication
        console.log("User returned from redirect flow:", result.user.displayName);
        
        // Force refresh the auth state
        await auth.updateCurrentUser(result.user);
        
        return { 
          success: true, 
          user: result.user,
        };
      } else {
        // Start the redirect flow
        console.log("Starting redirect flow for authentication...");
        // Store a flag in sessionStorage to detect redirect return
        sessionStorage.setItem('auth_redirect_started', 'true');
        sessionStorage.setItem('auth_redirect_timestamp', Date.now().toString());
        
        // Ensure auth is still available
        if (!auth) {
          throw new Error("Auth became unavailable");
        }
        
        await signInWithRedirect(auth, provider);
        // This code won't execute as the page will redirect
        return { success: true };
      }
    } catch (redirectError) {
      console.error("Redirect sign-in failed:", redirectError);
      throw redirectError;
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    console.error("Error details:", JSON.stringify({
      code: error.code,
      message: error.message,
      stack: error.stack
    }));
    
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      return { 
        success: false, 
        error: new Error("Sign-in was cancelled. Please try again.")
      };
    } else if (error.code === 'auth/popup-blocked' || error.message === "popup_blocked_by_browser") {
      return { 
        success: false, 
        error: new Error("Sign-in popup was blocked by your browser. Please allow popups for this site or try again in a new tab.")
      };
    } else if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: new Error("Network error. Please check your internet connection and try again.")
      };
    } else if (error.code === 'auth/internal-error') {
      return {
        success: false,
        error: new Error("Authentication service encountered an internal error. Please try again later.")
      };
    } else if (error.code === 'auth/web-storage-unsupported') {
      return {
        success: false,
        error: new Error("Authentication requires cookies and local storage to be enabled in your browser settings.")
      };
    }
    
    return { 
      success: false, 
      error: new Error(error.message || "Failed to sign in with Google. Please try again later.")
    };
  }
}

// Sign in with phone number
export async function signInWithPhoneNumber(phoneNumber: string, recaptchaVerifier: any) {
  try {
    // Format phone number with country code
    const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`
    console.log("Signing in with phone number:", formattedPhoneNumber)

    // DEVELOPMENT WORKAROUND: Check if we're in development mode
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
      console.log("Using development auth workaround - bypassing Firebase phone auth")
      
      // Create a mock confirmation result
      const mockVerificationId = "mock-verification-id-" + Date.now()
      const mockConfirmationResult = {
        verificationId: mockVerificationId,
        confirm: async (code: string) => {
          // Accept any 6-digit code in development
          if (code.length === 6 && /^\d+$/.test(code)) {
            // Create a mock user credential
            return {
              user: {
                uid: "dev-user-" + Date.now(),
                phoneNumber: formattedPhoneNumber,
                displayName: null,
                email: null,
                photoURL: null,
                isAnonymous: false,
                metadata: {
                  creationTime: new Date().toISOString(),
                  lastSignInTime: new Date().toISOString()
                }
              }
            }
          } else {
            throw new Error("Invalid verification code")
          }
        }
      }
      
      return { success: true, confirmationResult: mockConfirmationResult }
    }

    // Check OTP limit in production
    if (!AUTH_CONFIG.ENABLE_PHONE_AUTH) {
      console.error("Phone authentication is disabled in configuration");
      return { 
        success: false, 
        error: new Error("Phone authentication is currently disabled. Please use Google Sign-In instead.")
      };
    }
    
    // Check daily OTP limit
    if (typeof window !== "undefined") {
      try {
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get stored usage data
        const storedData = localStorage.getItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY);
        let usageData = storedData ? JSON.parse(storedData) : { date: today, count: 0 };
        
        // Reset counter if it's a new day
        if (usageData.date !== today) {
          usageData = { date: today, count: 0 };
        }
        
        // Check if limit is reached
        if (usageData.count >= AUTH_CONFIG.DAILY_OTP_LIMIT) {
          console.log(`OTP daily limit of ${AUTH_CONFIG.DAILY_OTP_LIMIT} reached`);
          return { 
            success: false, 
            error: new Error(AUTH_CONFIG.OTP_LIMIT_MESSAGE)
          };
        }
      } catch (error) {
        console.error("Error checking OTP limit:", error);
        // Continue even if there's an error with the limit checking
      }
    }

    // PRODUCTION: Use actual Firebase authentication
    console.log("Using real Firebase phone authentication")
    if (!auth) {
      console.error("Auth is not initialized")
      return { success: false, error: new Error("Auth is not initialized") }
    }

    // Verify that recaptchaVerifier is valid
    if (!recaptchaVerifier) {
      console.error("No recaptchaVerifier provided");
      return { 
        success: false, 
        error: new Error("Verification service is not available. Please refresh and try again.")
      };
    }
    
    if (typeof recaptchaVerifier.render !== 'function') {
      console.error("Invalid recaptchaVerifier provided", recaptchaVerifier);
      return { 
        success: false, 
        error: new Error("Verification service is not properly initialized. Please refresh and try again.")
      };
    }

    // Check if the recaptchaVerifier has already been used or needs to be re-rendered
    let needsRerender = false;
    try {
      // Try to get the widgetId, which should be available if the verifier has been rendered
      const widgetId = recaptchaVerifier._widgetId;
      if (!widgetId) {
        console.warn("reCAPTCHA widget ID not found, needs to re-render");
        needsRerender = true;
      }
      
      // Check if the reCAPTCHA element still exists in the DOM
      const recaptchaFrame = document.querySelector(`iframe[src*="recaptcha"][name^="a-${recaptchaVerifier._widgetId}"]`);
      if (!recaptchaFrame) {
        console.warn("reCAPTCHA iframe not found in DOM, needs to re-render");
        needsRerender = true;
      }
    } catch (error) {
      console.error("Error checking recaptchaVerifier state:", error);
      needsRerender = true;
    }
    
    // Re-render if needed
    if (needsRerender) {
      try {
        console.log("Re-rendering reCAPTCHA...");
        await recaptchaVerifier.render();
      } catch (renderError) {
        console.error("Failed to re-render reCAPTCHA:", renderError);
        return { 
          success: false, 
          error: new Error("Verification service failed. Please refresh the page and try again.")
        };
      }
    }

    // Add a small delay to ensure reCAPTCHA is fully ready
    await new Promise(resolve => setTimeout(resolve, 300));

    // Send the SMS verification code
    console.log("Calling firebaseSignInWithPhoneNumber with:", formattedPhoneNumber);
    
    try {
      const confirmationResult = await firebaseSignInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier);
      console.log("SMS verification code sent successfully");
      return { success: true, confirmationResult };
    } catch (smsError: any) {
      console.error("Error from Firebase signInWithPhoneNumber:", smsError);
      
      // Handle specific SMS sending errors
      if (smsError.code === 'auth/captcha-check-failed') {
        return { 
          success: false, 
          error: new Error("Verification check failed. Please try again."),
          code: 'auth/captcha-check-failed'
        };
      }
      
      throw smsError; // Re-throw to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    
    // Provide more specific error messages based on Firebase error codes
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-phone-number':
          return { 
            success: false, 
            error: new Error("The phone number is invalid. Please enter a valid 10-digit number."),
            code: error.code
          };
        case 'auth/missing-phone-number':
          return { 
            success: false, 
            error: new Error("Please enter your phone number."),
            code: error.code
          };
        case 'auth/quota-exceeded':
          return { 
            success: false, 
            error: new Error("SMS quota exceeded. Please try again later."),
            code: error.code
          };
        case 'auth/captcha-check-failed':
          return { 
            success: false, 
            error: new Error("reCAPTCHA verification failed. Please refresh and try again."),
            code: error.code
          };
        case 'auth/too-many-requests':
          return { 
            success: false, 
            error: new Error("Too many requests. Please try again later."),
            code: error.code
          };
        case 'auth/network-request-failed':
          return {
            success: false,
            error: new Error("Network error. Please check your internet connection and try again."),
            code: error.code
          };
        default:
          return { 
            success: false, 
            error: new Error(`Error: ${error.message || "Failed to send verification code"}`),
            code: error.code
          };
      }
    }
    
    // For non-code errors, check for common error messages
    if (error.message) {
      if (error.message.includes('captcha') || error.message.includes('reCAPTCHA')) {
        return { 
          success: false, 
          error: new Error("Verification check failed. Please refresh the page and try again."),
          code: 'auth/captcha-error'
        };
      }
      
      if (error.message.includes('network') || error.message.includes('connection')) {
        return {
          success: false,
          error: new Error("Network error. Please check your internet connection and try again."),
          code: 'network-error'
        };
      }
    }
    
    return { 
      success: false, 
      error: new Error("Failed to send verification code. Please try again.")
    };
  }
}

// Verify OTP
export async function verifyOTP(verificationId: string, verificationCode: string) {
  try {
    console.log("Verifying code for verification ID:", verificationId)
    
    // DEVELOPMENT WORKAROUND: Check if we're using the mock verification
    if (verificationId.startsWith("mock-verification-id-")) {
      console.log("Using development auth workaround for verification")
      
      // Accept any 6-digit code in development
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        // Create a mock user and sign in
        const mockUser = {
          uid: "dev-user-" + Date.now(),
          phoneNumber: "+91" + Math.floor(1000000000 + Math.random() * 9000000000),
          displayName: null,
          email: null,
          photoURL: null
        }
        
        console.log("Development mode: Creating mock user", mockUser)
        
        // Store the mock user in localStorage to simulate being signed in
        localStorage.setItem("dev-auth-user", JSON.stringify(mockUser))
        
        // Trigger a storage event to notify other tabs/components
        window.dispatchEvent(new Event("storage"))
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout")
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout")
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            window.location.href = "/checkout"
          }, 500)
        }
        
        return { success: true }
      } else {
        console.error("Invalid verification code format")
        throw new Error("Invalid verification code")
      }
    }

    // Validate OTP format
    if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      return { 
        success: false, 
        error: new Error("Please enter a valid 6-digit verification code") 
      };
    }

    // PRODUCTION: Use actual Firebase verification
    console.log("Using real Firebase verification")
    if (!auth) {
      console.error("Auth is not initialized")
      return { success: false, error: new Error("Auth is not initialized") }
    }

    try {
      console.log("Creating phone auth credential with verification ID and code");
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      
      console.log("Signing in with credential");
      const result = await signInWithCredential(auth, credential);
      console.log("User successfully authenticated with phone number:", result.user.phoneNumber);
      
      return { success: true, user: result.user };
    } catch (verificationError: any) {
      console.error("Error in verification process:", verificationError);
      
      // Handle specific verification errors
      if (verificationError.code) {
        switch (verificationError.code) {
          case 'auth/invalid-verification-code':
            return { 
              success: false, 
              error: new Error("The verification code is invalid. Please check and try again.") 
            };
          case 'auth/code-expired':
            return { 
              success: false, 
              error: new Error("The verification code has expired. Please request a new one.") 
            };
          default:
            return { 
              success: false, 
              error: new Error(`Verification failed: ${verificationError.message || 'Unknown error'}`) 
            };
        }
      }
      
      throw verificationError;
    }
  } catch (error: any) {
    console.error("Error verifying code:", error)
    return { 
      success: false, 
      error: new Error(error.message || "Failed to verify the code. Please try again.") 
    }
  }
}

// Sign out
export const signOut = async () => {
  try {
    if (!auth) {
      return { success: false, error: new Error("Auth is not initialized") }
    }

    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error }
  }
}

// Get current user
export const getCurrentUser = () => {
  if (typeof window === "undefined") {
    return null
  }

  if (!auth) {
    return null
  }

  return auth.currentUser
}

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  // Check if we're in development mode with a mock user
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === "true") {
    const devUser = localStorage.getItem("dev-auth-user")
    if (devUser) {
      try {
        const mockUser = JSON.parse(devUser)
        // Call callback with mock user
        setTimeout(() => callback(mockUser), 0)
        
        // Return a dummy unsubscribe function
    return () => {}
      } catch (e) {
        console.error("Error parsing dev user:", e)
      }
    }
  }

  // If no mock user or not in development, use Firebase auth
  const { onAuthStateChanged } = require("firebase/auth")
  return onAuthStateChanged(auth, callback)
}
