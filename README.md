<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/mqol-logo-white.png">
  <source media="(prefers-color-scheme: light)" srcset="/mqol-logo.png">
  <img alt="MQOL Logo" src="/mqol-logo.png" width="300">
</picture>

# 🏥 The Nest - MQOL Portal

Multi-tenant nurse portal platform for secure patient onboarding workflows. Built with Next.js, featuring enterprise-grade authentication, role-based access control, and healthcare compliance capabilities.

## 🏥 About The Nest

The Nest is MQOL's internal portal platform providing nursing teams with secure, compliant tools for patient onboarding workflows. Built on enterprise-grade infrastructure with multi-tenant architecture, role-based permissions, and integrated compliance features.

### 📚 API Integration Documentation

Complete documentation for all third-party service integrations is available in the `/documentation/` folder:

- **[NextAuth.js](./documentation/NEXTAUTH.md)** - Authentication with multiple providers
- **[Prisma ORM](./documentation/PRISMA.md)** - Database operations and schema management  
- **[Stripe](./documentation/STRIPE.md)** - Payment processing and subscriptions
- **[SAML Jackson](./documentation/JACKSON.md)** - Enterprise SSO and directory sync
- **[Svix](./documentation/SVIX.md)** - Webhook orchestration and events
- **[Sentry](./documentation/SENTRY.md)** - Error monitoring and performance tracking
- **[Retraced](./documentation/RETRACED.md)** - Audit logging and compliance
- **[Mixpanel](./documentation/MIXPANEL.md)** - User analytics and event tracking
- **[Google reCAPTCHA](./documentation/GOOGLE_RECAPTCHA.md)** - Bot protection and security
- **[Slack](./documentation/SLACK.md)** - Internal notifications and alerts
- **[OpenTelemetry](./documentation/OPENTELEMETRY_METRICS.md)** - Observability and metrics
- **[Email Services](./documentation/EMAIL_SERVICES.md)** - Transactional email delivery

Each guide includes setup instructions, configuration examples, security best practices, and troubleshooting tips.

## 🛠️ Built With

- [Next.js](https://nextjs.org)
  This is a React framework that provides features such as server-side rendering and static site generation. It's used for building the user interface of your application. The main configuration for Next.js can be found in `next.config.js`.
- [Tailwind CSS](https://tailwindcss.com)
  This is a utility-first CSS framework for rapidly building custom user interfaces. It's used for styling the application. The configuration for Tailwind CSS can be found in `postcss.config.js`.
- [Postgres](https://www.postgresql.org)
  This is a powerful, open source object-relational database system. It's used for storing application data. The connection to Postgres is likely managed through Prisma.
- [React](https://reactjs.org)
  This is a JavaScript library for building user interfaces. It's used for creating the interactive elements of your application. The React components are located in the components directory.
- [Prisma](https://www.prisma.io)
  This is an open-source database toolkit. It's used for object-relational mapping, which simplifies the process of writing database queries. Prisma configuration and schema can be found in the prisma directory.
- [TypeScript](https://www.typescriptlang.org)
  This is a typed superset of JavaScript that compiles to plain JavaScript. It's used to make the code more robust and maintainable. TypeScript definitions and configurations can be found in files like `next-env.d.ts` and `i18next.d.ts`.
- [SAML Jackson](https://github.com/boxyhq/jackson) (Provides SAML SSO, Directory Sync)
  This is a service for handling SAML SSO (Single Sign-On). It's used to allow users to sign in with a single ID and password to any of several related systems i.e (using a single set of credentials). The implementation of SAML Jackson is primarily located within the files associated with authentication.
- [Svix](https://www.svix.com/) (Provides Webhook Orchestration)
  This is a service for handling webhooks. It's used to emit events on user/team CRUD operations, which can then be caught and handled by other parts of the application or external services. The integration of Svix is distributed throughout the codebase, primarily in areas where Create, Read, Update, and Delete (CRUD) operations are executed.
- [Retraced](https://github.com/retracedhq/retraced) (Provides Audit Logs Service)
  This is a service for audit logging and data visibility. It helps track user activities within the application i.e (who did what and when in the application). The usage of Retraced would be dispersed throughout the codebase, likely in the files where important actions are performed.
- [Stripe](https://stripe.com) (Provides Payments)
  This is a service for handling payments. It's used to process payments for the application. The integration of Stripe is likely found in the files associated with billing and subscriptions.
- [Playwright](https://playwright.dev) (Provides E2E tests)
  This is a Node.js library for automating browsers. It's used to run end-to-end tests on the application. The Playwright configuration and tests can be found in the tests directory.
- [Docker](https://www.docker.com) (Provides Docker Compose)
  This is a platform for developing, shipping, and running applications. It's used to containerize the application and its dependencies. The Docker configuration can be found in the Dockerfile and docker-compose.yml.
- [NextAuth.js](https://next-auth.js.org) (Provides Authentication)
  This is a complete open-source authentication solution for Next.js applications. It's used to handle user authentication and authorization. The NextAuth.js configuration and providers can be found in the `pages/api/auth/[...nextauth].ts` file.

## 🚀 Deployment

This is an internal MQOL portal. Deployment instructions and environment configurations are managed through internal DevOps processes.

## ✨ Getting Started

Please follow these simple steps to get a local copy up and running.

### Prerequisites

- Node.js (Version: >=18.x)
- PostgreSQL
- NPM
- Docker compose

### Development

#### 1. Setup

- Clone the repository:

```bash
git clone https://github.com/mqol/saas-starter-kit.git
```

#### 2. Go to the project folder

```bash
cd saas-starter-kit
```

#### 3. Install dependencies

```bash
npm install
```

#### 4. Set up your .env file

Duplicate `.env.example` to `.env`.

```bash
cp .env.example .env
```

#### 5. Create a database (Optional)

To make the process of installing dependencies easier, we offer a `docker-compose.yml` with a Postgres container.

```bash
docker-compose up -d
```

#### 6. Set up database schema

```bash
npx prisma db push
```

#### 7. Start the server

In a development environment:

```bash
npm run dev
```

#### 8. Start the Prisma Studio

Prisma Studio is a visual editor for the data in your database.

```bash
npx prisma studio
```

#### 9. Testing

We are using [Playwright](https://playwright.dev/) to execute E2E tests. Add all tests inside the `/tests` folder.

Update `playwright.config.ts` to change the playwright configuration.

##### Install Playwright dependencies

```bash
npm run playwright:update
```

##### Run E2E tests

```bash
npm run test:e2e
```

_Note: HTML test report is generated inside the `report` folder. Currently supported browsers for test execution `chromium` and `firefox`_

## ⚙️ Feature configuration

To get started you only need to configure the database by following the steps above. For more advanced features, you can configure the following:

### Authentication with NextAuth.js

The default login options are email and GitHub. Configure below:

1. Generate a secret key for NextAuth.js by running `openssl rand -base64 32` and adding it to the `.env` file as `NEXTAUTH_SECRET`.
2. For email login, configure the `SMTP_*` environment variables in the `.env` file to send magic link login emails. You can use services like [AWS SES](https://aws.amazon.com/ses/), [Sendgrid](https://sendgrid.com/) or [Resend](https://resend.com/).
3. For social login with GitHub and Google, you need to create OAuth apps in the respective developer consoles and add the client ID and secret to the `.env` file. The default is email login and For GitHub, follow the instructions [here](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app). For Google, follow the instructions [here](https://support.google.com/cloud/answer/6158849?hl=en).

### Svix Webhooks

1. Create an account on [Svix](https://www.svix.com/)
2. The authenticaton token and add `SVIX_API_KEY` to the `.env` file.

### Stripe Payments

1. Create an account on [Stripe](https://stripe.com/)
2. Add the [Stripe API secret key](https://dashboard.stripe.com/apikeys) to the `.env` file as `STRIPE_SECRET_KEY`.
3. Create a webhook in the [Stripe dashboard](https://dashboard.stripe.com/webhooks). The URL is your app hostname plus `/api/webhooks/stripe`. If you want to set this up locally you will need to use the [Stripe CLI forwarder](https://docs.stripe.com/webhooks#test-webhook).
4. Once created, add the signing secret to the `.env` file as `STRIPE_WEBHOOK_SECRET`.

### Recaptcha

1. Create an account on [Google reCAPTCHA](https://www.google.com/recaptcha/admin/enterprise). This will create a Google Cloud account if you don't have one.
2. From the Key Details in the [Google Cloud Console](https://console.cloud.google.com/security/recaptcha), add the reCAPTCHA ID to the `.env` file as `RECAPTCHA_SITE_KEY`.
3. Click Key Details > Integration then click Use legacy key to get the secret key and add it to the `.env` file as `RECAPTCHA_SECRET_KEY`.

### Sentry

1. Create an account on [Sentry](https://sentry.io/), skip the onboarding and create a new Next.js project.
2. At the bottom of the page, get the DSN and add it to the `.env` file as `SENTRY_DSN`. The other variables are optional.

#### Fully customizable boilerplate out of the box, see images below 👇👇👇

![saas-starter-kit-poster](/public/saas-starter-kit-poster.png)

## 🥇 Features

- Create account
- Sign in with Email and Password
- Sign in with Magic Link
- Sign in with SAML SSO
- Sign in with Google [[Setting up Google OAuth](https://support.google.com/cloud/answer/6158849?hl=en)]
- Sign in with GitHub [[Creating a Github OAuth App](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)]
- Directory Sync (SCIM)
- Update account
- Create team
- Delete team
- Invite users to the team
- Manage team members
- Update team settings
- Webhooks & Events
- Internationalization
- Audit logs
- Roles and Permissions
- Dark mode
- Email notifications
- E2E tests
- Docker compose
- Prisma Studio
- Update member role
- Directory Sync Events
- Avatar Upload
- SAML SSO
- Audit Log
- Webhook
- Payments
- Security Headers

## ➡️ Coming Soon

- Billing & subscriptions
- Unit and integration tests

## 🚀 Feature Development

The platform uses an intelligent agent-based system for adding new features:

### Development Agents

• **@quick-implement** - Simple 1-3 file changes, bug fixes, component updates
• **@structured-work** - Medium complexity features with PRD→tasks→execution workflow  
• **@add-feature** - Complex features requiring 5-pass iterative architectural planning

### Agent Usage

```bash
# Simple changes
@quick-implement Add validation to email input field

# Medium complexity
@structured-work Add user notification preferences system

# Complex features  
@add-feature Add comprehensive audit logging with export capabilities
```

### Feature Development Process

1. **Choose appropriate agent** based on feature complexity
2. **Agent analyzes codebase** and existing patterns
3. **Interactive refinement** through multiple passes
4. **Implementation planning** with MVP and enhancement phases
5. **Technical validation** ensuring architectural consistency

All feature work is saved to `/features/` directory. See [Feature Development Guide](./documentation/feature-development-template.md) for complete details.

## 🏥 MQOL Development

This is an internal portal for MQOL. For development questions or technical support, please contact the internal development team.

## 🛡️ License

[Apache 2.0 License](https://github.com/boxyhq/saas-starter-kit/blob/main/LICENSE)
