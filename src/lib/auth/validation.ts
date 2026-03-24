import * as z from "zod"
import { passwordStrength } from "check-password-strength"
import { profanityFilter } from "@/lib/profanity"

// Password strength configuration
const passwordStrengthConfig = {
  minLength: 8,
  minScore: 2, // 0-3 scale (Too weak, Weak, Medium, Strong)
  requirements: {
    uppercase: 1,
    lowercase: 1,
    numbers: 1,
    symbols: 1
  }
}

// Username restrictions
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'support',
  'help', 'info', 'contact', 'mail', 'email', 'webmaster'
]

// Email domain restrictions
const BLOCKED_DOMAINS = [
  'tempmail.com', 'throwawaymail.com', 'guerrillamail.com',
  'mailinator.com', 'fakeinbox.com', 'yopmail.com'
]

// Custom validators
const validatePasswordStrength = (password: string) => {
  const result = passwordStrength(password)
  return result.id >= passwordStrengthConfig.minScore
}

const validateUsername = (username: string) => {
  // Check for reserved usernames
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return false
  }
  // Check for profanity
  if (profanityFilter.isProfane(username)) {
    return false
  }
  return true
}

const validateEmail = (email: string) => {
  const domain = email.split('@')[1].toLowerCase()
  if (BLOCKED_DOMAINS.includes(domain)) {
    return false
  }
  return true
}

// Enhanced registration schema
export const registrationSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s-']+$/, "Name can only contain letters, spaces, hyphens and apostrophes")
    .transform(val => val.trim())
    .refine(val => val.length >= 2, "Name cannot be only whitespace"),

  email: z.string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .refine(validateEmail, "This email domain is not allowed"),

  password: z.string()
    .min(passwordStrengthConfig.minLength, `Password must be at least ${passwordStrengthConfig.minLength} characters`)
    .max(100, "Password cannot exceed 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .refine(validatePasswordStrength, "Password is not strong enough"),

  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens")
    .transform(val => val.toLowerCase())
    .refine(validateUsername, "This username is not allowed or contains inappropriate content"),

  bio: z.string()
    .max(500, "Bio cannot exceed 500 characters")
    .transform(val => val.trim())
    .refine(val => !profanityFilter.isProfane(val), "Bio contains inappropriate content")
    .optional(),
})

// Type for the registration data
export type RegistrationData = z.infer<typeof registrationSchema>

// Enhanced error messages
export const getValidationErrorMessage = (error: z.ZodError) => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))
  return {
    message: "Validation failed",
    errors
  }
} 