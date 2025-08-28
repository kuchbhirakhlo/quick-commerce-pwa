"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signInWithPhoneNumber, verifyOTP, initRecaptchaVerifier } from "@/lib/firebase/auth"
import { useFirebase } from "@/lib/context/firebase-provider"
import { useRouter } from "next/navigation"
import { AUTH_CONFIG } from "@/lib/firebase/config"
import { useAuth } from "@/lib/context/auth-context"

// Add type declarations for global objects
declare global {
  interface Window {
    grecaptcha: any;
  }
  
  interface Error {
    code?: string;
  }
}

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const recaptchaVerifierRef = useRef<any>(null)
  const { isAuthInitialized, isLoading: firebaseLoading, initializeAuth } = useFirebase()
  const router = useRouter()
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  const [otpCount, setOtpCount] = useState<number>(0);
  const [otpLimitReached, setOtpLimitReached] = useState<boolean>(false);
  const { refreshAuthState } = useAuth()
  const recaptchaInitAttempts = useRef(0)
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Thorough cleanup of all reCAPTCHA elements
  const cleanupRecaptcha = () => {
    // Clear any existing recaptcha elements
    const existingRecaptchas = document.querySelectorAll('.grecaptcha-badge, .grecaptcha-logo, div[class^="grecaptcha-"], iframe[src*="recaptcha"]');
    existingRecaptchas.forEach(element => {
      element.remove();
    });
    
    // Remove any hidden recaptcha iframes
    const iframes = document.querySelectorAll('iframe[src*="recaptcha"], iframe[title*="recaptcha"]');
    iframes.forEach(element => {
      element.remove();
    });
    
    // Remove any reCAPTCHA scripts
    const scripts = document.querySelectorAll('script[src*="recaptcha"]');
    scripts.forEach(element => {
      element.remove();
    });
    
    // Clear any global reCAPTCHA variables
    if (typeof window !== "undefined" && window.grecaptcha) {
      try {
        // @ts-ignore
        delete window.grecaptcha;
      } catch (error) {
        console.error("Error clearing global reCAPTCHA object:", error);
      }
    }
    
    // Clear the verifier reference
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        console.error("Error clearing recaptcha verifier:", error);
      }
      recaptchaVerifierRef.current = null;
    }
    
    setRecaptchaInitialized(false);
  };

  // Cleanup any existing recaptcha elements when component mounts and unmounts
  useEffect(() => {
    cleanupRecaptcha();
    
    return () => {
      // Clear any pending timers
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
      
      // Cleanup when component unmounts
      cleanupRecaptcha();
    };
  }, []);

  // Initialize recaptcha with improved reliability
  const initializeRecaptcha = async () => {
    if (
      typeof window !== "undefined" &&
      recaptchaContainerRef.current &&
      isAuthInitialized &&
      !recaptchaInitialized &&
      !firebaseLoading
    ) {
      recaptchaInitAttempts.current += 1;
      console.log(`Initializing reCAPTCHA (attempt ${recaptchaInitAttempts.current})`);
      
      try {
        // Clean up existing instances first
        cleanupRecaptcha();
        
        // Make sure the container is visible and has dimensions
        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = '';
          recaptchaContainerRef.current.style.width = "100%";
          recaptchaContainerRef.current.style.height = "80px";
          recaptchaContainerRef.current.style.display = "block";
        }
        
        // Force a small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize the reCAPTCHA verifier
        recaptchaVerifierRef.current = await initRecaptchaVerifier("recaptcha-container");
        console.log("reCAPTCHA initialized successfully");
        setRecaptchaInitialized(true);
        setError(null);
        return true;
      } catch (error) {
        console.error("Error initializing recaptcha:", error);
        setError("Failed to initialize verification. Please try refreshing the page.");
        return false;
      }
    }
    return false;
  };

  // Initialize recaptcha when component mounts with retry mechanism
  useEffect(() => {
    const attemptInitialization = async () => {
      // Don't try to initialize if conditions aren't met
      if (!isAuthInitialized || firebaseLoading || recaptchaInitialized) {
        return;
      }
      
      // Try to initialize
      const success = await initializeRecaptcha();
      
      // If failed and under max attempts, try again with exponential backoff
      if (!success && recaptchaInitAttempts.current < 5) {
        const delay = Math.min(1000 * Math.pow(1.5, recaptchaInitAttempts.current - 1), 8000);
        console.log(`reCAPTCHA initialization failed, retrying in ${delay}ms`);
        
        // Clear any existing timer
        if (initializationTimerRef.current) {
          clearTimeout(initializationTimerRef.current);
        }
        
        // Set a new timer for the next attempt
        initializationTimerRef.current = setTimeout(attemptInitialization, delay);
      }
    };

    // Start initialization process when auth is ready
    if (isAuthInitialized && !recaptchaInitialized && !firebaseLoading) {
      attemptInitialization();
    }
    
    // Cleanup function
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
      }
    };
  }, [isAuthInitialized, recaptchaInitialized, firebaseLoading]);

  // Check OTP usage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const today = new Date().toISOString().split('T')[0];
        const storedData = localStorage.getItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY);
        if (storedData) {
          const usageData = JSON.parse(storedData);
          if (usageData.date === today) {
            setOtpCount(usageData.count);
            setOtpLimitReached(usageData.count >= AUTH_CONFIG.DAILY_OTP_LIMIT);
          }
        }
      } catch (error) {
        console.error("Error checking OTP usage:", error);
      }
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      setIsLoading(false);
      return;
    }

    try {
      // Check if recaptcha is initialized
      if (!recaptchaVerifierRef.current || !recaptchaInitialized) {
        console.log("reCAPTCHA not initialized, attempting to initialize now");
        
        // Reset attempt counter for a fresh start
        recaptchaInitAttempts.current = 0;
        
        // Try to initialize recaptcha again
        const success = await initializeRecaptcha();
        
        if (!success) {
          throw new Error("Could not initialize verification. Please refresh the page and try again.");
        }
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA not initialized");
      }

      console.log("Sending OTP to +91" + phoneNumber);
      const { success, confirmationResult, error } = await signInWithPhoneNumber(
        phoneNumber,
        recaptchaVerifierRef.current
      );

      if (success && confirmationResult) {
        setVerificationId(confirmationResult.verificationId);
        setStep("otp");
        
        // Update OTP usage count
        try {
          const today = new Date().toISOString().split('T')[0];
          const newCount = otpCount + 1;
          setOtpCount(newCount);
          setOtpLimitReached(newCount >= AUTH_CONFIG.DAILY_OTP_LIMIT);
          
          localStorage.setItem(AUTH_CONFIG.OTP_USAGE_STORAGE_KEY, JSON.stringify({
            date: today,
            count: newCount
          }));
        } catch (e) {
          console.error("Failed to update OTP usage count:", e);
        }
      } else {
        // If there's a reCAPTCHA error, try to reinitialize it
        if (error && (error.message?.includes('captcha') || error.code === 'auth/captcha-check-failed')) {
          cleanupRecaptcha();
          await initializeRecaptcha();
          setError("Verification check failed. Please try again.");
        } else {
          setError((error as { message?: string })?.message || "Failed to send verification code. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      setError(error?.message || "Failed to send verification code. Please try again.");
      
      // If there's a reCAPTCHA error, try to reinitialize it
      if (error.message?.includes('captcha') || error.code === 'auth/captcha-check-failed') {
        cleanupRecaptcha();
        await initializeRecaptcha();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!verificationId) {
        throw new Error("Verification ID not found");
      }

      const { success, error } = await verifyOTP(verificationId, verificationCode);

      if (success) {
        // Close the modal
        onClose();
        
        // Check if we need to redirect to checkout
        const shouldRedirectToCheckout = localStorage.getItem("redirect_to_checkout");
        if (shouldRedirectToCheckout === "true") {
          localStorage.removeItem("redirect_to_checkout");
          // Add a small delay to ensure auth state is updated
          setTimeout(() => {
            router.push("/checkout");
          }, 500);
        } else {
          refreshAuthState();
          router.refresh();
        }
      } else {
        setError((error as { message?: string })?.message || "Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setError(error?.message || "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if Firebase is still initializing
  if (firebaseLoading || !isAuthInitialized) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/logo.webp" alt="Buzzat" width={60} height={60} className="mx-auto" />
          </div>
          <DialogTitle className="text-xl">
            {step === "phone" ? "India's last minute app" : "Enter verification code"}
          </DialogTitle>
          {step === "phone" && <p className="text-sm text-gray-500 mt-1">Log in or Sign up</p>}
          {step === "otp" && (
            <p className="text-sm text-gray-500 mt-1">We've sent a 6-digit code to +91 {phoneNumber}</p>
          )}
        </DialogHeader>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

        {step === "phone" ? (
          <>
            {otpLimitReached ? (
              <div className="bg-amber-50 text-amber-600 p-3 rounded-md text-sm mb-4">
                Daily OTP limit reached. Please try again tomorrow.
              </div>
            ) : (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-l-none"
                    maxLength={10}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    disabled={isLoading || otpLimitReached}
                  />
                </div>
                
                {otpCount > 0 && otpCount < AUTH_CONFIG.DAILY_OTP_LIMIT && (
                  <div className="text-xs text-amber-600 text-center">
                    {AUTH_CONFIG.DAILY_OTP_LIMIT - otpCount} OTP verifications remaining today
                  </div>
                )}
                
                <div 
                  id="recaptcha-container" 
                  ref={recaptchaContainerRef} 
                  className="h-[80px] flex justify-center items-center"
                  style={{ minHeight: '80px', width: '100%' }}
                ></div>
                
                {!recaptchaInitialized && !isLoading && (
                  <div className="text-xs text-amber-600 text-center">
                    Initializing verification... If it doesn't appear, please try refreshing the page.
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading || otpLimitReached || !recaptchaInitialized}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    "Continue with Phone"
                  )}
                </Button>
                
                {!recaptchaInitialized && recaptchaInitAttempts.current >= 3 && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => {
                      recaptchaInitAttempts.current = 0;
                      initializeRecaptcha();
                    }}
                  >
                    Retry verification initialization
                  </Button>
                )}
              </form>
            )}
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full bg-green-600 text-white hover:bg-green-700"
              disabled={isLoading || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setStep("phone")}
              disabled={isLoading}
            >
              Change phone number
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
