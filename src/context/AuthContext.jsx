import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const AuthContext = createContext(null)

const SESSION_TOKEN_KEY = 'atelier_session_token'

export function AuthProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(() =>
    localStorage.getItem(SESSION_TOKEN_KEY)
  )
  const [isLoading, setIsLoading] = useState(true)

  // Convex mutations
  const signupMutation = useMutation(api.auth.signup)
  const loginMutation = useMutation(api.auth.login)
  const logoutMutation = useMutation(api.auth.logout)
  const updateProfileMutation = useMutation(api.auth.updateProfile)
  const changePasswordMutation = useMutation(api.auth.changePassword)

  // Validate session query
  const validatedUser = useQuery(
    api.auth.validateSession,
    sessionToken ? { sessionToken } : "skip"
  )

  // User is the validated user from the session
  const user = validatedUser ?? null
  const isAuthenticated = !!user

  // Handle loading state - we're loading if we have a token but haven't validated yet
  useEffect(() => {
    if (sessionToken === null) {
      // No token, not loading
      setIsLoading(false)
    } else if (validatedUser !== undefined) {
      // Have token and query has returned (either user or null)
      setIsLoading(false)
    } else {
      // Have token but query hasn't returned yet - still loading
      setIsLoading(true)
    }
  }, [sessionToken, validatedUser])

  // Clear invalid session
  useEffect(() => {
    if (sessionToken && validatedUser === null && !isLoading) {
      localStorage.removeItem(SESSION_TOKEN_KEY)
      setSessionToken(null)
    }
  }, [sessionToken, validatedUser, isLoading])

  const signup = useCallback(async ({ email, password, name }) => {
    try {
      const result = await signupMutation({ email, password, name })
      localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken)
      setSessionToken(result.sessionToken)
      return { success: true, user: result.user }
    } catch (error) {
      // Parse Convex error messages to user-friendly format
      let errorMessage = error.message || 'Signup failed'

      // Clean up Convex error formatting
      if (errorMessage.includes('Uncaught Error:')) {
        errorMessage = errorMessage.replace('Uncaught Error:', '').trim()
      }

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('email already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.'
      } else if (errorMessage.toLowerCase().includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (errorMessage.toLowerCase().includes('password must be')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      return { success: false, error: errorMessage }
    }
  }, [signupMutation])

  const login = useCallback(async ({ email, password }) => {
    try {
      const result = await loginMutation({ email, password })
      if (!result || !result.sessionToken) {
        console.error('Login returned invalid result:', result)
        return { success: false, error: 'Login failed - no session token returned' }
      }
      localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken)
      setSessionToken(result.sessionToken)
      return { success: true, user: result.user }
    } catch (error) {
      console.error('Login error:', error)
      // Parse Convex error messages to user-friendly format
      let errorMessage = error.message || 'Login failed'

      // Clean up Convex error formatting
      if (errorMessage.includes('Uncaught Error:')) {
        errorMessage = errorMessage.replace('Uncaught Error:', '').trim()
      }

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      return { success: false, error: errorMessage }
    }
  }, [loginMutation])

  const logout = useCallback(async () => {
    try {
      if (sessionToken) {
        await logoutMutation({ sessionToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY)
      setSessionToken(null)
    }
  }, [sessionToken, logoutMutation])

  const updateProfile = useCallback(async (updates) => {
    if (!sessionToken) {
      return { success: false, error: 'Not authenticated' }
    }
    try {
      const result = await updateProfileMutation({
        sessionToken,
        ...updates,
      })
      return { success: true, user: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [sessionToken, updateProfileMutation])

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (!sessionToken) {
      return { success: false, error: 'Not authenticated' }
    }
    try {
      await changePasswordMutation({
        sessionToken,
        currentPassword,
        newPassword,
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [sessionToken, changePasswordMutation])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    sessionToken,
    signup,
    login,
    logout,
    updateProfile,
    changePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
