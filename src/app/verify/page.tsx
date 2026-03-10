"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Save, Loader2 } from "lucide-react"
import toast from 'react-hot-toast'
import { useSession } from "next-auth/react"

export default function VerifyAccount() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const {data: session} = useSession()

  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const action = searchParams.get("action")

 if(session?.user) {
    router.push("/")
  }
  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid verification link")
      router.push("/auth")
      return
    }

    setUserEmail(email)

    // Check if this is for password setup (invited user) or just verification (signup user)
    if (action === 'set_password') {
      setNeedsPassword(true)
    } else {
      // Auto-verify for signup users
      handleVerification()
    }
  }, [token, email, action])

  const handleVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token || '')}&email=${encodeURIComponent(email || '')}`)
      const data = await response.json()

      if (response.ok) {
        setIsVerified(true)
        toast.success("Account verified successfully! You can now log in.")
        setTimeout(() => {
          router.push("/auth")
        }, 2000)
      } else {
        toast.error(data.error || "Verification failed")
        router.push("/auth")
      }
    } catch (error) {
      toast.error("Verification failed")
      router.push("/auth")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSetup = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      // First verify the token
      const verifyResponse = await fetch(`/api/auth/verify?token=${encodeURIComponent(token || '')}&email=${encodeURIComponent(email || '')}`)
      if (!verifyResponse.ok) {
        throw new Error("Verification failed")
      }

      // Then update password (you might want to create a separate endpoint for this)
      const passwordResponse = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || '', password, token: token || '' }),
      })

      if (passwordResponse.ok) {
        setIsVerified(true)
        toast.success("Password set successfully! You can now log in.")
        setTimeout(() => {
          router.push("/auth")
        }, 2000)
      } else {
        const data = await passwordResponse.json()
        toast.error(data.error || "Failed to set password")
      }
    } catch (error) {
      toast.error("Failed to complete setup")
    } finally {
      setIsLoading(false)
    }
  }

  if (needsPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="sm:max-w-md bg-card border-border p-0 overflow-hidden border border-[var(--border-gray)] rounded-lg shadow-lg">
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-card-foreground">
                Set Your Password
              </h2>
              <p className="text-muted-foreground text-sm">
                Complete your account setup by setting a password
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-card-foreground font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[#E4E4E7] bg-white px-4 py-1.5 pr-10 text-sm font-normal text-[#09090B] outline-none"
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-card-foreground font-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-[#E4E4E7] bg-white px-4 py-1.5 pr-10 text-sm font-normal text-[#09090B] outline-none"
                  placeholder="Confirm your password"
                />
              </div>

              <Button
                onClick={handlePasswordSetup}
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? <Loader2 className="text-[#FAFAFA] h-4 w-4 animate-spin mr-2" /> : <Save className="text-[#FAFAFA] h-4 w-4 mr-2" />}
                Set Password & Activate Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="sm:max-w-md bg-card border-border p-0 overflow-hidden border border-[var(--border-gray)] rounded-lg shadow-lg">
        <div className="p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {isLoading ? "Verifying..." : isVerified ? "Account Verified!" : "Verification Failed"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Please wait while we verify your account..."
                : isVerified
                ? "Your account has been successfully verified. You can now log in."
                : "There was an issue verifying your account. Please try again or contact support."
              }
            </p>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
          )}

          {isVerified && (
            <Button
              onClick={() => router.push("/auth")}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Go to Login
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
