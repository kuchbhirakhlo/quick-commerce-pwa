"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { signInWithGoogle } from "@/lib/firebase/auth"
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
  const router = useRouter();
  const { refreshAuthState } = useAuth();





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



  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/logo.webp" alt="Buzzat" width={60} height={60} className="mx-auto" />
          </div>
          <DialogTitle className="text-xl">Log in or Sign up</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Continue with Google</p>
        </DialogHeader>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-2">{error}</div>}

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
              </>)}
          </Button>
        </>

        <p className="text-xs text-center text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;


