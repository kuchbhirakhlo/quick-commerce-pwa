"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { useAuth } from "@/lib/context/auth-context"
import { LoginModal } from "@/components/auth/login-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone } from "lucide-react"

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  
  // Redirect if not logged in
  useEffect(() => {
    setMounted(true)
    
    if (mounted && !loading) {
      if (!user) {
        setShowLoginModal(true)
      } else {
        // Populate form with user data
        setName(user.displayName || "")
        setEmail(user.email || "")
        setPhoneNumber(user.phoneNumber || "")
      }
    }
  }, [user, loading, mounted])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would update the user profile in your backend
    alert("Profile updated successfully!")
  }
  
  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        router.push('/')
      } else {
        console.error("Sign out failed:", result.error)
      }
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }
  
  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </main>
    )
  }

  // If user is not logged in, show login modal
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg mb-4">Please log in to view your profile</p>
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal 
            onClose={() => {
              setShowLoginModal(false);
              // If still not logged in after closing modal, redirect to home
              if (!user) {
                router.push('/');
              }
            }} 
          />
        )}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  disabled
                  className="pl-10 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                Save Changes
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
} 