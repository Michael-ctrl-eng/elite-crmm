"use client"

import { signIn } from "next-auth/react"
import { useEffect, useMemo, useState, type InputHTMLAttributes } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"

const baseSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = baseSchema.extend({
  name: z.string().min(1, "Full name is required"),
  confirmPassword: z.string().min(6, "Confirm your password"),
  tenantName: z.string().min(2, "Workspace name is required").max(50, "Workspace name too long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

const loginSchema = baseSchema.extend({
  name: z.string(),
  confirmPassword: z.string(),
  tenantName: z.string(),
})

type AuthFormValues = z.infer<typeof signupSchema>

interface InvitationInfo {
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export function AuthModal() {
  const [isSignUp, setIsSignUp] = useState(false)
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true"
  const [error, setError] = useState("")
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [lastEmailAttempt, setLastEmailAttempt] = useState("")
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [checkingInvite, setCheckingInvite] = useState(false)
  const [createNewTenant, setCreateNewTenant] = useState(true)

  // Check invitation on mount
  useEffect(() => {
    if (inviteToken) {
      setCheckingInvite(true)
      fetch(`/api/invitation?token=${inviteToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setInvitation(data.invitation)
            setIsSignUp(true)
            setCreateNewTenant(false)
          } else {
            toast.error(data.error || "Invalid invitation")
          }
        })
        .catch(() => toast.error("Failed to verify invitation"))
        .finally(() => setCheckingInvite(false))
    }
  }, [inviteToken])

  const resolver = useMemo(() => zodResolver(isSignUp ? signupSchema : loginSchema), [isSignUp])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AuthFormValues>({
    resolver,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      tenantName: "",
    },
  })

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation) {
      setValue('email', invitation.email)
    }
  }, [invitation, setValue])

  useEffect(() => {
    reset({ name: "", email: "", password: "", confirmPassword: "", tenantName: "" })
  }, [isSignUp, reset])

  useEffect(() => {
    if (session?.user) {
      router.push("/")
    }
  }, [session, router])

  const onSubmit = async (values: AuthFormValues) => {
    setError("")
    setShowResendVerification(false)

    if (isSignUp) {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation?.email || values.email,
          password: values.password,
          name: values.name,
          tenantName: values.tenantName,
          createNewTenant,
          inviteToken: inviteToken || undefined,
        }),
      })

      if (res.ok) {
        const result = await signIn("credentials", {
          email: invitation?.email || values.email,
          password: values.password,
          redirect: false,
          callbackUrl: "/",
        })

        if (result?.error) {
          setError(result.error)
        } else if (result?.ok) {
          router.push("/")
        }
      } else {
        const data = await res.json()
        setError(data.error || "Signup failed")
      }
      return
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: "/",
    })

    if (result?.error) {
      if (result.error.includes("Password is incorrect")) {
        setError("Password is incorrect")
      } else if (result.error.includes("No account found")) {
        setError("No account found with this email address")
      } else if (result.error.includes("Email and password are required")) {
        setError("Please enter both email and password")
      } else if (result.error.includes("Account is not active")) {
        setError("Account is not active. Please check your email for the verification link.")
        setShowResendVerification(true)
        setLastEmailAttempt(values.email)
      } else {
        setError(result.error)
      }
    } else if (result?.ok) {
      router.push("/")
    }
  }

  const handleResendVerification = async () => {
    if (!lastEmailAttempt) return

    setResendLoading(true)
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastEmailAttempt }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.")
      } else {
        toast.error(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      toast.error("Failed to resend verification email")
    } finally {
      setResendLoading(false)
    }
  }

  if (checkingInvite) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-black rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen luxury-gradient-bg p-4">
      <div className="w-full max-w-md luxury-glass floating-luxury rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Elite CRM</h1>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isSignUp
                ? invitation
                  ? `Join ${invitation.tenant.name} as ${invitation.role}`
                  : "Create your workspace and start managing your business"
                : "Sign in to your account"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
              {showResendVerification && (
                <div className="mt-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}
            </div>
          )}

          {invitation && isSignUp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-900">{invitation.tenant.name}</p>
                  <p className="text-sm text-blue-600">Role: {invitation.role}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4">
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            )}

            {isSignUp && (
              <Field
                label="Full Name"
                error={errors.name?.message}
                inputProps={{
                  ...register("name"),
                  placeholder: "John Doe",
                }}
              />
            )}

            <Field
              label="Email"
              error={errors.email?.message}
              inputProps={{
                ...register("email"),
                type: "email",
                placeholder: "m@example.com",
                disabled: !!invitation,
                value: invitation?.email || undefined,
              }}
            />

            <Field
              label="Password"
              error={errors.password?.message}
              inputProps={{
                ...register("password"),
                type: "password",
                placeholder: "••••••••",
              }}
            />

            {isSignUp && (
              <Field
                label="Confirm Password"
                error={errors.confirmPassword?.message}
                inputProps={{
                  ...register("confirmPassword"),
                  type: "password",
                  placeholder: "••••••••",
                }}
              />
            )}

            {isSignUp && !invitation && (
              <Field
                label="Workspace Name"
                error={errors.tenantName?.message}
                inputProps={{
                  ...register("tenantName"),
                  placeholder: "My Company",
                }}
              />
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {signupEnabled && !invitation && (
            <div className="text-center text-sm">
              <span className="text-gray-600">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-black hover:text-gray-800 font-semibold hover:underline transition-colors duration-200"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  inputProps,
}: {
  label: string
  error?: string
  inputProps: InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <div className="space-y-2">
      <label className="text-gray-700 font-medium text-sm" htmlFor={inputProps.name as string}>
        {label}
      </label>
      <input
        {...inputProps}
        className="bg-white/50 border border-white/40 text-gray-900 placeholder:text-gray-400 w-full px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 transition-all duration-300 shadow-sm hover:bg-white/70 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {error ? <div className="text-red-500 text-sm">{error}</div> : null}
    </div>
  )
}
