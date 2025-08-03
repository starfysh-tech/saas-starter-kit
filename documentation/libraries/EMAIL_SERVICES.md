# Email Services Documentation

## Overview

This SaaS starter kit includes a comprehensive email system built with Nodemailer, React Email templates, and NextAuth.js integration. It supports transactional emails like magic link authentication, password resets, team invitations, and welcome messages.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# SMTP Configuration (Required)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Email Features (Optional)
CONFIRM_EMAIL=true
DISABLE_NON_BUSINESS_EMAIL_SIGNUP=true
```

### Package Dependencies

The starter kit includes these email-related packages:

```json
{
  "nodemailer": "6.10.1",
  "@react-email/components": "0.0.42",
  "@react-email/render": "1.1.2",
  "@types/nodemailer": "6.4.17"
}
```

## Implementation Details

### Core Files

- `lib/email/sendEmail.ts` - Core Nodemailer configuration and sending logic
- `lib/email/` - Specialized email functions (magic link, password reset, etc.)
- `components/emailTemplates/` - React Email template components
- `lib/email/utils.ts` - Email validation and utility functions
- `lib/email/freeEmailService.json` - List of free email providers

### Email Service Configuration

```typescript
// lib/email/sendEmail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false, // Use STARTTLS
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
});

export const sendEmail = async (data: EmailData) => {
  if (!env.smtp.host) {
    console.warn('SMTP not configured, skipping email send');
    return;
  }

  return await transporter.sendMail({
    from: env.smtp.from,
    to: data.to,
    subject: data.subject,
    html: data.html,
  });
};
```

## Email Provider Setup

### AWS SES Configuration

```env
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA... # Your SES SMTP username
SMTP_PASSWORD=BH4r... # Your SES SMTP password
SMTP_FROM=noreply@yourdomain.com
```

#### AWS SES Setup Steps
1. Verify your domain in AWS SES console
2. Create SMTP credentials
3. Configure DNS records (SPF, DKIM, DMARC)
4. Request production access (remove sandbox mode)

### SendGrid Configuration

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### SendGrid Setup Steps
1. Create SendGrid account and verify domain
2. Generate API key with mail send permissions
3. Configure domain authentication
4. Set up IP warmup for dedicated IPs

### Resend Configuration

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### Resend Setup Steps
1. Create Resend account and add domain
2. Generate API key
3. Verify DNS records
4. Configure webhook endpoints (optional)

## Email Templates

### React Email Components

The starter kit includes these email templates:

- `MagicLink.tsx` - Magic link authentication emails
- `TeamInvite.tsx` - Team member invitation emails
- `WelcomeEmail.tsx` - New user welcome emails
- `ResetPassword.tsx` - Password reset emails
- `VerificationEmail.tsx` - Email verification emails
- `AccountLocked.tsx` - Account lockout notifications

### Base Template Structure

```tsx
// components/emailTemplates/EmailLayout.tsx
import { Html, Head, Preview, Body, Container } from '@react-email/components';

interface EmailLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body className="bg-gray-100 font-sans">
        <Container className="mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {children}
          </div>
        </Container>
      </Body>
    </Html>
  );
};
```

### Custom Template Example

```tsx
// components/emailTemplates/TeamInvite.tsx
import { Button, Heading, Text, Link } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface TeamInviteProps {
  inviterName: string;
  teamName: string;
  inviteUrl: string;
}

export const TeamInvite = ({ inviterName, teamName, inviteUrl }: TeamInviteProps) => {
  return (
    <EmailLayout preview={`Join ${teamName} on ${app.name}`}>
      <Heading className="text-2xl font-bold text-gray-900 mb-4">
        You're invited to join {teamName}
      </Heading>
      
      <Text className="text-gray-700 mb-6">
        {inviterName} has invited you to join the {teamName} team on {app.name}.
      </Text>
      
      <Button
        href={inviteUrl}
        className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
      >
        Accept Invitation
      </Button>
      
      <Text className="text-sm text-gray-500 mt-8">
        If you don't want to join this team, you can ignore this email.
      </Text>
    </EmailLayout>
  );
};
```

## Email Functions

### Magic Link Authentication

```typescript
// lib/email/sendMagicLink.ts
export const sendMagicLink = async (email: string, url: string) => {
  const html = render(
    MagicLink({
      subject: `Sign in to ${app.name}`,
      url,
    })
  );

  return await sendEmail({
    to: email,
    subject: `Sign in to ${app.name}`,
    html,
  });
};
```

### Team Invitation

```typescript
// lib/email/sendTeamInviteEmail.ts
export const sendTeamInviteEmail = async (
  email: string,
  inviterName: string,
  teamName: string,
  inviteUrl: string
) => {
  const html = render(
    TeamInvite({
      inviterName,
      teamName,
      inviteUrl,
    })
  );

  return await sendEmail({
    to: email,
    subject: `You're invited to join ${teamName}`,
    html,
  });
};
```

### Password Reset

```typescript
// lib/email/sendPasswordResetEmail.ts
export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  const html = render(
    ResetPassword({
      resetUrl,
    })
  );

  return await sendEmail({
    to: email,
    subject: `Reset your ${app.name} password`,
    html,
  });
};
```

## Email Validation

### Business Email Validation

```typescript
// lib/email/utils.ts
import freeEmailProviders from './freeEmailService.json';

export const isBusinessEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return !freeEmailProviders.includes(domain);
};

export const validateEmailForSignup = (email: string): boolean => {
  if (env.disableNonBusinessEmailSignup) {
    return isBusinessEmail(email);
  }
  return true;
};
```

### Email Domain Validation

```typescript
// Check if email domain matches team domain
export const validateEmailDomain = (email: string, allowedDomains: string[]): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
};
```

## NextAuth.js Integration

### Email Provider Configuration

```typescript
// lib/nextAuth.ts
providers.push(
  EmailProvider({
    server: {
      host: env.smtp.host,
      port: env.smtp.port,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.password,
      },
    },
    from: env.smtp.from,
    sendVerificationRequest: async ({ identifier: email, url, provider }) => {
      await sendMagicLink(email, url);
    },
  })
);
```

## Testing & Development

### Development Setup

```env
# Use Mailtrap for development testing
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=test@yourdomain.com
```

### Email Template Development

```bash
# Preview templates in browser
npm run email dev --dir components/emailTemplates

# Build templates
npm run email build --dir components/emailTemplates
```

### Testing Email Delivery

```typescript
// Create test endpoint for development
// pages/api/test-email.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    await sendMagicLink('test@example.com', 'http://localhost:4002/test-link');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Best Practices

### Email Authentication

#### DNS Records Setup

```dns
# SPF Record
TXT @ v=spf1 include:amazonses.com ~all

# DKIM (configured in provider dashboard)
# AWS SES, SendGrid, Resend handle this automatically

# DMARC Policy
TXT _dmarc v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### Rate Limiting

```typescript
// Simple rate limiting implementation
const emailRateLimit = new Map();

export const checkEmailRateLimit = (email: string): boolean => {
  const now = Date.now();
  const lastSent = emailRateLimit.get(email) || 0;
  
  if (now - lastSent < 60000) { // 1 minute between emails
    return false;
  }
  
  emailRateLimit.set(email, now);
  return true;
};
```

### Error Handling

```typescript
export const sendEmailSafely = async (data: EmailData) => {
  try {
    await sendEmail(data);
    console.log(`Email sent successfully to ${data.to}`);
  } catch (error) {
    console.error('Email send failed:', {
      to: data.to,
      subject: data.subject,
      error: error.message,
    });
    
    // Don't throw - continue application flow
    // Log to monitoring service (Sentry)
    Sentry.captureException(error);
  }
};
```

## Production Considerations

### Monitoring

```typescript
// Track email metrics
export const sendEmailWithMetrics = async (data: EmailData) => {
  const startTime = Date.now();
  
  try {
    await sendEmail(data);
    
    // Track success metrics
    recordMetric('email.sent', 1, { 
      type: data.type,
      provider: env.smtp.host 
    });
  } catch (error) {
    // Track failure metrics
    recordMetric('email.failed', 1, { 
      type: data.type,
      error: error.code 
    });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    recordMetric('email.duration', duration, { 
      type: data.type 
    });
  }
};
```

### Compliance

#### CAN-SPAM Compliance

```tsx
// Add to EmailLayout.tsx
<Text className="text-xs text-gray-500 mt-8 pt-4 border-t">
  {app.company.name}<br/>
  {app.company.address}<br/>
  <Link href="/unsubscribe" className="text-blue-600">
    Unsubscribe
  </Link>
</Text>
```

#### GDPR Compliance

```typescript
// Email consent tracking
export const trackEmailConsent = async (userId: string, emailType: string) => {
  await prisma.emailConsent.create({
    data: {
      userId,
      emailType,
      consentedAt: new Date(),
      ipAddress: req.ip,
    },
  });
};
```

## Troubleshooting

### Common Issues

**Emails Not Sending**
- Verify SMTP credentials are correct
- Check if SMTP_HOST environment variable is set
- Test connection with provider's SMTP server
- Review firewall and network settings

**Emails Going to Spam**
- Verify SPF, DKIM, and DMARC records
- Use authenticated domain for sending
- Avoid spam trigger words in subject/content
- Monitor sender reputation

**Template Rendering Issues**
- Ensure React Email components are properly imported
- Check for syntax errors in JSX templates
- Verify all required props are passed to templates

### Debug Mode

```typescript
// Enable debug logging
const transporter = nodemailer.createTransporter({
  // ... config
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});
```

## Related Files
- `lib/email/sendEmail.ts:1` - Core email sending function
- `lib/email/sendMagicLink.ts:1` - Magic link email implementation
- `components/emailTemplates/EmailLayout.tsx:1` - Base email template
- `lib/email/utils.ts:1` - Email validation utilities
- `lib/nextAuth.ts:72` - NextAuth.js email provider configuration