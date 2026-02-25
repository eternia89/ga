'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()
  }, [supabase.auth])

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Client-side validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      // Success — sign out so user must log in with new password
      setSuccess(true)
      setIsLoading(false)
      await supabase.auth.signOut()

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            Verifying reset link...
          </div>
        </div>
      </div>
    )
  }

  // If no valid session, show error
  if (!hasSession) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            Invalid reset link
          </h1>
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>
              This password reset link is invalid or has expired. Please
              request a new one.
            </p>
          </div>
          <Link
            href="/reset-password"
            className="block w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          Set new password
        </h1>

        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">Password updated successfully</p>
            <p className="mt-1">Redirecting to login...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
