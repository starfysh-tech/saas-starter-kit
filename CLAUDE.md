# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

• **NEVER Start development server** yourself, check whether it is running first or ask the user to start it.
• **Build project**: `npm run build` (includes Prisma generation and database push)
• **Type checking**: `npm run check-types`
• **Linting**: `npm run check-lint`
• **Format code**: `npm run format`
• **Check formatting**: `npm run check-format`
• **Run all checks**: `npm run test-all` (format, lint, types, build)
• **Unit tests**: `npm test`
• **Unit tests with coverage**: `npm run test:cov`
• **E2E tests**: `npm run test:e2e` (Playwright)
• **Database operations**: `npx prisma db push`, `npx prisma studio`

## Claude Code MCP Configuration

This project uses Model Context Protocol (MCP) servers for enhanced development capabilities:

• **Playwright MCP**: Browser automation and testing (@executeautomation/playwright-mcp-server)
• **Sequential Thinking**: Multi-step problem solving and analysis (@executeautomation/sequential-thinking-mcp)  
• **Context7**: Up-to-date library documentation retrieval (@context7/mcp-server)

MCP configuration is in `.claude/settings.local.json`. Use these tools for browser automation, complex analysis, and fetching current API documentation.

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
• Patient management system with HIPAA-aware design
• SAML SSO via BoxyHQ Jackson
• Directory Sync (SCIM)
• Webhooks via Svix
• Payments via Stripe
• Audit logging via Retraced
• Email services
• User analytics via Mixpanel
• Bot protection via Google reCAPTCHA
• Internal notifications via Slack
• Observability via OpenTelemetry
• Error monitoring via Sentry
• Internationalization (i18next)

### Directory Structure

• `/components/` - React components organized by feature (auth, team, billing, patient, etc.)
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

### Third-Party Integrations

Complete documentation for all third-party service integrations is available in `/documentation/`:

• NextAuth.js - Authentication with multiple providers
• Prisma ORM - Database operations and schema management
• Stripe - Payment processing and subscriptions
• SAML Jackson - Enterprise SSO and directory sync
• Svix - Webhook orchestration and events
• Sentry - Error monitoring and performance tracking
• Retraced - Audit logging and compliance
• Mixpanel - User analytics and event tracking
• Google reCAPTCHA - Bot protection and security
• Slack - Internal notifications and alerts
• OpenTelemetry - Observability and metrics
• Email Services - Transactional email delivery

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
• Patient - Team-scoped patient records with audit tracking
• Account - OAuth account linking
• Session - User sessions
• ApiKey - Team-scoped API keys

### API Structure

• `/api/teams/[slug]/` - Team-scoped endpoints
• `/api/teams/[slug]/patients/` - Patient CRUD operations
• `/api/auth/` - Authentication endpoints
• `/api/webhooks/` - External webhook receivers

## Patient Management System

• **Feature Flag**: `FEATURE_TEAM_PATIENTS` in env variables
• **Components**: `/components/patient/` directory with CRUD forms and list views
• **API Routes**: `/pages/api/teams/[slug]/patients/` for CRUD operations
• **Data Model**: Patient model with team scoping and HIPAA-compliant soft delete
• **Permissions**: `team_patient` resource in permission system
• **HIPAA Compliance**: 7-year retention period, audit logging, soft delete architecture
• **Deletion Behavior**: Archive/unarchive instead of permanent deletion
• **Audit Trail**: Comprehensive logging for all patient operations via Retraced

## Development Notes

• Port 4002 is used for both dev and production
• Database migrations are in `/prisma/migrations/`
• Email templates use React Email in `/components/emailTemplates/`
• TypeScript is strictly enforced
• ESLint and Prettier are configured  
• Playwright E2E tests cover critical user flows
• Development logs are written to `/logs/dev.log`

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

## Working with Documentation

When integrating new services or updating existing ones:

1. **Use Context7 MCP** only when:

   - Documentation file doesn't exist for a service being integrated
   - Code examples fail due to API changes (deprecated methods, changed parameters)
   - Environment setup instructions don't work with current service versions
   - Security practices are flagged as outdated by linters/security tools

2. **Don't use Context7 MCP** for general updates, performance improvements, or stylistic changes

3. **Update integration guides**: Create or update `.md` files in `/documentation/` following existing patterns
4. **Include security practices**: Always document security considerations and best practices
5. **Provide code examples**: Include practical implementation examples and common patterns
