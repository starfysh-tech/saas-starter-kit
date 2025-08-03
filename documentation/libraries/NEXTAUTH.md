# NextAuth.js Integration Guide

NextAuth.js is the primary authentication framework for this SaaS starter kit, providing secure authentication with multiple providers and session management.

## Overview

NextAuth.js handles:
- Multiple authentication providers (OAuth, credentials, email)
- Session management with JWT or database sessions
- CSRF protection and security headers
- User account linking and profile management

## Configuration

### Environment Variables

Required environment variables in `.env.local`:

```bash
# Core NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Provider (for magic links)
EMAIL_SERVER=smtp://username:password@smtp.gmail.com:587
EMAIL_FROM=noreply@yourapp.com
```

### Core Setup

The main configuration is in `lib/nextAuth.ts`:

```typescript
import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Custom authentication logic
        const user = await authenticateUser(credentials)
        return user || null
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      // Customize session object
      return session
    },
    async jwt({ token, user }) {
      // Customize JWT token
      return token
    },
  },
})
```

## Providers Configuration

### OAuth Providers

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add client ID and secret to environment variables

#### Google OAuth
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID with callback URL: `http://localhost:3000/api/auth/callback/google`
3. Add client ID and secret to environment variables

### Email Provider (Magic Links)

Configure SMTP settings for passwordless authentication:

```typescript
EmailProvider({
  server: {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  from: process.env.EMAIL_FROM,
})
```

### Credentials Provider

For email/password authentication:

```typescript
CredentialsProvider({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (credentials) => {
    const { email, password } = credentials
    
    // Validate credentials against database
    const user = await getUserFromDb(email, password)
    
    if (user && validatePassword(password, user.hashedPassword)) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    }
    
    return null
  },
})
```

## Session Management

### JWT Strategy (Default)
Best for serverless deployments:

```typescript
export const { handlers, auth } = NextAuth({
  session: { strategy: "jwt" },
  // ... other config
})
```

### Database Strategy
For persistent sessions with database storage:

```typescript
export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  // ... other config
})
```

## Usage in Components

### Client Components

```typescript
'use client'
import { useSession, signIn, signOut } from "next-auth/react"

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>

  if (session) {
    return (
      <>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  
  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
```

### Server Components

```typescript
import { auth } from "@/lib/nextAuth"

export default async function Profile() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <h1>Welcome {session.user?.name}</h1>
      <p>{session.user?.email}</p>
    </div>
  )
}
```

### API Routes

```typescript
import { auth } from "@/lib/nextAuth"

export async function GET() {
  const session = await auth()

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  return Response.json({ user: session.user })
}
```

## Database Integration

### Prisma Adapter

Install the adapter:

```bash
npm install @auth/prisma-adapter
```

Configure in NextAuth:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // ... other config
})
```

### Required Database Schema

The adapter requires specific tables. Add to your Prisma schema:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Security Best Practices

### Environment Variables
- Always use strong, unique `NEXTAUTH_SECRET` in production
- Store OAuth secrets securely
- Use different secrets for different environments

### CSRF Protection
NextAuth.js automatically handles CSRF protection. Ensure your forms include the CSRF token:

```typescript
import { getCsrfToken } from "next-auth/react"

export async function getServerSideProps(context) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}
```

### Session Configuration

```typescript
export const { handlers, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
})
```

## Testing

### Mock Authentication in Tests

```typescript
import { jest } from '@jest/globals'

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { email: 'test@example.com', name: 'Test User' },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
```

## Troubleshooting

### Common Issues

1. **"Invalid state parameter"** - Check callback URLs match exactly
2. **"Missing NEXTAUTH_SECRET"** - Ensure environment variable is set
3. **Database connection errors** - Verify DATABASE_URL and run migrations

### Debug Mode

Enable debug logging in development:

```typescript
export const { handlers, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  // ... other config
})
```

## Migration Guide

When upgrading NextAuth.js versions, refer to the official migration guides and update:
- Configuration syntax
- Callback signatures
- Provider configurations
- Database schema changes

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Provider Configuration Guide](https://next-auth.js.org/providers)
- [Database Adapters](https://next-auth.js.org/adapters)
- [Security Considerations](https://next-auth.js.org/warnings)