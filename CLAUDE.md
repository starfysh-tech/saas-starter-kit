# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

• **Start development server**: `npm run dev` (runs on port 4002)
• **Build project**: `npm run build` (includes Prisma generation and database push)
• **Production start**: `npm start` (runs on port 4002)
• **Type checking**: `npm run check-types`
• **Linting**: `npm run check-lint`
• **Format code**: `npm run format`
• **Check formatting**: `npm run check-format`
• **Run all checks**: `npm run test-all` (format, lint, types, build)
• **Unit tests**: `npm test`
• **Unit tests with coverage**: `npm run test:cov`
• **E2E tests**: `npm run test:e2e` (Playwright)
• **Database operations**: `npx prisma db push`, `npx prisma studio`

## Database & Environment Setup

• Copy `.env.example` to `.env` and configure
• Use `docker-compose up -d` for local Postgres database
• Run `npx prisma db push` to set up database schema
• Run `npx prisma studio` to view/edit data

## Architecture Overview

This is a multi-tenant SaaS starter kit built with Next.js, featuring:

### Core Framework Stack

• Next.js 15 with TypeScript
• PostgreSQL database via Prisma ORM
• NextAuth.js for authentication
• Tailwind CSS + daisyUI for styling

### Key Features & Integrations

• Multi-tenant team management system
• SAML SSO via BoxyHQ Jackson
• Directory Sync (SCIM)
• Webhooks via Svix
• Payments via Stripe
• Audit logging via Retraced
• Email services
• Internationalization (i18next)

### Directory Structure

• `/components/` - React components organized by feature (auth, team, billing, etc.)
• `/pages/` - Next.js pages and API routes
• `/lib/` - Core utilities, configurations, and services
• `/models/` - Database model functions
• `/prisma/` - Database schema and migrations
• `/hooks/` - Custom React hooks
• `/tests/` - E2E tests using Playwright
• `/documentation/` - Technical documentation and third-party API integration guides
• `/types/` - TypeScript type definitions
• `/styles/` - Global CSS and styling
• `/public/` - Static assets
• `/locales/` - Internationalization files

### Authentication Architecture

The app supports multiple auth providers configured in `lib/nextAuth.ts`:
• Email/password with credentials provider
• Magic link via email provider
• OAuth (GitHub, Google)
• SAML SSO via BoxyHQ
• IdP-initiated login

### Multi-tenancy

Teams are the core tenant model:
• Users can belong to multiple teams
• Role-based access control (OWNER, ADMIN, MEMBER)
• Team-scoped API keys, webhooks, and settings
• Invitation system for team onboarding

### Database Models

Key entities in Prisma schema:
• User - Individual users
• Team - Tenant organizations
• TeamMember - User-team relationships with roles
• Account - OAuth account linking
• Session - User sessions
• ApiKey - Team-scoped API keys

### API Structure

• `/api/teams/[slug]/` - Team-scoped endpoints
• `/api/auth/` - Authentication endpoints
• `/api/webhooks/` - External webhook receivers

## Development Notes

• Port 4002 is used for both dev and production
• Database migrations are in `/prisma/migrations/`
• Email templates use React Email in `/components/emailTemplates/`
• TypeScript is strictly enforced
• ESLint and Prettier are configured  
• Playwright E2E tests cover critical user flows

## Performance Profiling

• **Performance monitoring**: Built-in server and client-side profiling tools
• **Database profiling**: Automatic slow query detection with Prisma logging
• **API monitoring**: Request timing and performance metrics tracking
• **Client monitoring**: Core Web Vitals and component performance tracking
• **Debug endpoint**: `GET /api/debug/performance` (development only)
• **Enable profiling**: Set `ENABLE_PERFORMANCE_PROFILING=true` in `.env`
• **Documentation**: See `/documentation/performance-profiling.md` for comprehensive guide

## Testing

• Unit tests use Jest with jsdom environment
• E2E tests use Playwright with fixtures in `/tests/e2e/support/fixtures/`
• Run `npm run playwright:update` to install Playwright dependencies
• HTML test reports generated in `/playwright-report/`
