# Google reCAPTCHA Integration Guide

Google reCAPTCHA v3 provides bot protection for forms and user interactions without disrupting the user experience through invisible background analysis.

## Overview

reCAPTCHA v3:
- Provides continuous protection without user interaction
- Returns a score (0.0-1.0) indicating likelihood of human user
- Allows custom actions for different user interactions
- Integrates seamlessly with forms and API endpoints

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Google reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

### Google reCAPTCHA Setup

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v3
3. Add your domain (e.g., `localhost`, `yourapp.com`)
4. Get your Site Key and Secret Key

## Client-Side Implementation

### reCAPTCHA Component

Create `components/shared/GoogleReCAPTCHA.tsx`:

```typescript
'use client'
import { useEffect, useRef } from 'react'

interface GoogleReCAPTCHAProps {
  onToken: (token: string) => void
  action: string
  siteKey?: string
}

export default function GoogleReCAPTCHA({ 
  onToken, 
  action, 
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY 
}: GoogleReCAPTCHAProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!siteKey) {
      console.warn('reCAPTCHA site key not provided')
      return
    }

    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      // Initialize reCAPTCHA when script loads
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          console.log('reCAPTCHA ready')
        })
      }
    }

    return () => {
      // Cleanup script on unmount
      document.head.removeChild(script)
    }
  }, [siteKey])

  const executeRecaptcha = async () => {
    if (!window.grecaptcha || !siteKey) return

    try {
      const token = await window.grecaptcha.execute(siteKey, { action })
      onToken(token)
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error)
    }
  }

  return (
    <div ref={recaptchaRef}>
      <button 
        type="button" 
        onClick={executeRecaptcha}
        className="hidden"
      >
        Execute reCAPTCHA
      </button>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}
```

### reCAPTCHA Hook

Create `hooks/useRecaptcha.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'

interface UseRecaptchaReturn {
  executeRecaptcha: (action: string) => Promise<string | null>
  isLoaded: boolean
  error: string | null
}

export function useRecaptcha(): UseRecaptchaReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      setError('reCAPTCHA site key not configured')
      return
    }

    // Check if script already loaded
    if (window.grecaptcha) {
      setIsLoaded(true)
      return
    }

    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true

    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsLoaded(true)
        setError(null)
      })
    }

    script.onerror = () => {
      setError('Failed to load reCAPTCHA script')
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [siteKey])

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!isLoaded || !window.grecaptcha || !siteKey) {
      setError('reCAPTCHA not ready')
      return null
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action })
      setError(null)
      return token
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'reCAPTCHA execution failed'
      setError(errorMessage)
      return null
    }
  }, [isLoaded, siteKey])

  return {
    executeRecaptcha,
    isLoaded,
    error,
  }
}
```

## Form Integration

### Contact Form Example

```typescript
'use client'
import { useState } from 'react'
import { useRecaptcha } from '@/hooks/useRecaptcha'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { executeRecaptcha, isLoaded } = useRecaptcha()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) {
      alert('reCAPTCHA not ready. Please try again.')
      return
    }

    setIsSubmitting(true)

    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeRecaptcha('contact_form')
      
      if (!recaptchaToken) {
        throw new Error('reCAPTCHA verification failed')
      }

      // Submit form with reCAPTCHA token
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Form submission failed')
      }

      alert('Message sent successfully!')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Form submission error:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isLoaded}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>

      <p className="text-xs text-gray-500">
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" className="underline">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" className="underline">
          Terms of Service
        </a>{' '}
        apply.
      </p>
    </form>
  )
}
```

## Server-Side Verification

### Verification Utility

Create `lib/recaptcha.ts`:

```typescript
interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  'error-codes'?: string[]
}

export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  minimumScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    return { success: false, error: 'reCAPTCHA secret key not configured' }
  }

  if (!token) {
    return { success: false, error: 'reCAPTCHA token not provided' }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}`,
      }
    }

    // Check action if specified
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}`,
      }
    }

    // Check score
    if (data.score < minimumScore) {
      return {
        success: false,
        score: data.score,
        error: `Score too low: ${data.score} (minimum: ${minimumScore})`,
      }
    }

    return {
      success: true,
      score: data.score,
    }
  } catch (error) {
    return {
      success: false,
      error: `reCAPTCHA verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
```

### API Route Example

Create `pages/api/contact.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { verifyRecaptcha } from '@/lib/recaptcha'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message, recaptchaToken } = req.body

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Verify reCAPTCHA
  const recaptchaResult = await verifyRecaptcha(
    recaptchaToken,
    'contact_form', // Expected action
    0.5 // Minimum score
  )

  if (!recaptchaResult.success) {
    console.error('reCAPTCHA verification failed:', recaptchaResult.error)
    return res.status(400).json({ error: 'reCAPTCHA verification failed' })
  }

  // Log score for monitoring
  console.log(`reCAPTCHA score: ${recaptchaResult.score}`)

  try {
    // Process the form submission
    // Send email, save to database, etc.
    
    res.status(200).json({ 
      message: 'Contact form submitted successfully',
      score: recaptchaResult.score,
    })
  } catch (error) {
    console.error('Contact form processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

## Action-Specific Implementation

### Login Form Protection

```typescript
// In login form
const handleLogin = async (credentials: LoginCredentials) => {
  const recaptchaToken = await executeRecaptcha('login')
  
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...credentials,
      recaptchaToken,
    }),
  })
}

// In API route
const recaptchaResult = await verifyRecaptcha(
  recaptchaToken,
  'login',
  0.3 // Lower threshold for login
)
```

### Registration Form Protection

```typescript
// In registration form
const handleRegister = async (userData: RegisterData) => {
  const recaptchaToken = await executeRecaptcha('register')
  
  // Submit with token
}

// In API route - higher threshold for registration
const recaptchaResult = await verifyRecaptcha(
  recaptchaToken,
  'register',
  0.7 // Higher threshold for registration
)
```

## Score-Based Actions

### Handling Different Score Ranges

```typescript
export function handleRecaptchaScore(score: number, action: string) {
  console.log(`reCAPTCHA score for ${action}: ${score}`)

  if (score >= 0.9) {
    // Very likely human - allow immediately
    return { allow: true, requireAdditional: false }
  } else if (score >= 0.5) {
    // Likely human - allow with monitoring
    return { allow: true, requireAdditional: false }
  } else if (score >= 0.3) {
    // Suspicious - require additional verification
    return { 
      allow: true, 
      requireAdditional: true,
      message: 'Additional verification required'
    }
  } else {
    // Likely bot - block or challenge
    return { 
      allow: false, 
      requireAdditional: true,
      message: 'Security verification failed'
    }
  }
}
```

### Adaptive Thresholds

```typescript
// Different thresholds for different actions
const RECAPTCHA_THRESHOLDS = {
  contact_form: 0.5,
  login: 0.3,
  register: 0.7,
  password_reset: 0.4,
  api_access: 0.6,
  payment: 0.8,
} as const

export function getThresholdForAction(action: string): number {
  return RECAPTCHA_THRESHOLDS[action as keyof typeof RECAPTCHA_THRESHOLDS] || 0.5
}
```

## Testing

### Development Mode

```typescript
// Mock reCAPTCHA in development
if (process.env.NODE_ENV === 'development') {
  export const mockVerifyRecaptcha = async () => ({
    success: true,
    score: 0.9,
  })
}
```

### Test Utilities

```typescript
// Test component for reCAPTCHA
export function RecaptchaTestComponent() {
  const { executeRecaptcha, isLoaded, error } = useRecaptcha()

  const testRecaptcha = async () => {
    const token = await executeRecaptcha('test')
    console.log('reCAPTCHA token:', token)
  }

  return (
    <div className="p-4 border rounded">
      <h3>reCAPTCHA Test</h3>
      <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
      <button onClick={testRecaptcha} disabled={!isLoaded}>
        Test reCAPTCHA
      </button>
    </div>
  )
}
```

## Monitoring & Analytics

### Score Logging

```typescript
// Log scores for analysis
export function logRecaptchaScore(
  action: string,
  score: number,
  userId?: string,
  additional?: Record<string, any>
) {
  console.log('reCAPTCHA Score:', {
    action,
    score,
    userId,
    timestamp: new Date().toISOString(),
    ...additional,
  })

  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'recaptcha_score', {
      action,
      score: Math.round(score * 100),
      user_id: userId,
    })
  }
}
```

## Troubleshooting

### Common Issues

1. **"Invalid site key"** - Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
2. **"Missing required parameters"** - Ensure secret key is set server-side
3. **Low scores** - Check for bot traffic or adjust thresholds
4. **Script loading errors** - Verify domain is registered with reCAPTCHA

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_RECAPTCHA = process.env.NODE_ENV === 'development'

export function debugRecaptcha(message: string, data?: any) {
  if (DEBUG_RECAPTCHA) {
    console.log(`[reCAPTCHA Debug] ${message}`, data)
  }
}
```

## Security Best Practices

### Environment Variables
- Never expose secret key on client-side
- Use different keys for different environments
- Rotate keys periodically

### Score Validation
- Set appropriate thresholds for different actions
- Monitor score distributions
- Implement fallback verification methods

### Rate Limiting
- Combine with rate limiting for additional protection
- Monitor for unusual patterns
- Implement progressive delays for failed attempts

## Resources

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Score Interpretation Guide](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)
- [Best Practices](https://developers.google.com/recaptcha/docs/v3#best_practices)