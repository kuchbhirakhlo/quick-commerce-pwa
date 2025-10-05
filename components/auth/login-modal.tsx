"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { signInWithGoogle, initRecaptchaVerifier, signInWithPhoneNumber, verifyOTP } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
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

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"choose" | "otp">("choose");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaRef = useRef<any>(null);
  const router = useRouter();
  const { refreshAuthState } = useAuth();

  useEffect(() => {
    let timer: any;
    if (resendSeconds > 0) {
      timer = setInterval(() => {
        setResendSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    return () => {
      try {
        if (recaptchaRef.current && typeof recaptchaRef.current.clear === "function") {
          recaptchaRef.current.clear();
        }
      } catch { }
    };
  }, []);

  // Clear loading message when recaptcha is ready
  useEffect(() => {
    if (recaptchaRef.current) {
      const container = document.getElementById("recaptcha-container");
      if (container) {
        const loadingDiv = container.querySelector(".text-gray-500");
        if (loadingDiv) {
          loadingDiv.remove();
        }
      }
    }
  }, [recaptchaRef.current]);

  const ensureRecaptcha = async () => {
    if (!recaptchaRef.current) {
      // Ensure the container exists and has proper dimensions before initializing
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        throw new Error("Recaptcha container not found");
      }

      // Ensure container is visible and has dimensions
      container.style.width = "100%";
      container.style.minHeight = "80px";
      container.style.display = "block";

      recaptchaRef.current = await initRecaptchaVerifier("recaptcha-container");
    }
    return recaptchaRef.current;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { success, error: googleError, user } = await signInWithGoogle();
      if (success && user) {
        onClose();
        refreshAuthState();
        router.refresh();
      } else if (success && !user) {
        setRedirecting(true);
      } else {
        setError(
          typeof googleError === "object" && googleError !== null && "message" in googleError
            ? (googleError as { message?: string }).message || "Google sign-in failed. Please try again."
            : "Google sign-in failed. Please try again."
        );
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError(null);
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    try {
      setSending(true);
      const verifier = await ensureRecaptcha();
      const result = await signInWithPhoneNumber(phone, verifier);
      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        // For emulator/dev path we store a mock verificationId on the object
        const id = result.confirmationResult.verificationId || "mock-verification-id-" + Date.now();
        setVerificationId(id);
        setStep("otp");
        setResendSeconds(30);
      } else if (!result.success) {
        setError(result.error?.message || "Failed to send OTP. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!verificationId) {
      setError("Verification not initialized. Please resend code.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP");
      return;
    }
    try {
      setVerifying(true);
      let ok = false;
      if (confirmationResult && typeof confirmationResult.confirm === "function") {
        try {
          await confirmationResult.confirm(otp);
          ok = true;
        } catch (e: any) {
          setError(e?.message || "Verification failed. Please try again.");
          ok = false;
        }
      } else {
        const res = await verifyOTP(verificationId, otp);
        ok = !!res.success;
        if (!ok) setError(res.error?.message || "Verification failed. Please try again.");
      }

      if (ok) {
        onClose();
        refreshAuthState();
        // Optional: Redirect to checkout if set
        const shouldRedirect = typeof window !== "undefined" && localStorage.getItem("redirect_to_checkout") === "true";
        if (shouldRedirect) {
          localStorage.removeItem("redirect_to_checkout");
          router.push("/checkout");
        } else {
          router.refresh();
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/logo.webp" alt="Buzzat" width={60} height={60} className="mx-auto" />
          </div>
          <DialogTitle className="text-xl">Log in or Sign up</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Continue with Google or mobile OTP</p>
        </DialogHeader>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-2">{error}</div>}

        {step === "choose" && (
          <>
            <Button
              type="button"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || redirecting}
            >
              {googleLoading || redirecting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {redirecting ? "Redirecting to Google..." : "Signing in..."}
                </div>
              ) : (
                <>
                  <svg className="inline-block mr-2" width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.7 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.13 13.13 17.57 9.5 24 9.5z" /><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.93 37.13 46.1 31.36 46.1 24.55z" /><path fill="#FBBC05" d="M10.67 28.29c-1.01-2.9-1.01-6.01 0-8.91l-7.98-6.2C.86 17.18 0 20.48 0 24c0 3.52.86 6.82 2.69 9.82l7.98-6.2z" /><path fill="#EA4335" d="M24 48c6.18 0 11.64-2.05 15.52-5.59l-7.19-5.6c-2.01 1.35-4.6 2.15-8.33 2.15-6.43 0-11.87-3.63-14.33-8.79l-7.98 6.2C6.71 42.18 14.82 48 24 48z" /><path fill="none" d="M0 0h48v48H0z" /></g></svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="my-4 flex items-center">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-3 text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">Mobile number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  className="rounded-l-none"
                />
              </div>
              <div id="recaptcha-container" className="mt-2 min-h-[80px] flex items-center justify-center bg-gray-50 rounded border">
                <div className="text-sm text-gray-500">Loading verification...</div>
              </div>
              <Button className="w-full" disabled={sending} onClick={handleSendCode}>
                {sending ? "Sending..." : "Send OTP"}
              </Button>
              <p className="text-xs text-gray-500">Protected by reCAPTCHA • Google Privacy Policy & Terms apply.</p>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">We sent an OTP to +91 {phone}. Enter it below.</p>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <Button className="w-full" onClick={handleVerify} disabled={verifying || otp.length !== 6}>
                {verifying ? "Verifying..." : "Verify"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSendCode} disabled={sending || resendSeconds > 0}>
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : "Resend OTP"}
              </Button>
            </div>
          </>
        )}

        <p className="text-xs text-center text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
