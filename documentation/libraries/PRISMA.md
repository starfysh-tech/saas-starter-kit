# Prisma ORM Integration Guide

Prisma ORM is the database toolkit used in this SaaS starter kit, providing type-safe database access, schema management, and migrations for PostgreSQL.

## Overview

Prisma provides:

- Type-safe database client with auto-completion
- Database schema modeling and migrations
- Query optimization and connection pooling
- Multi-database support and scalability features

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# Optional: Direct connection for migrations (when using connection pooling)
DIRECT_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
```

### Prisma Schema

The main configuration is in `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example models from the SaaS starter kit
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  teamMembers   TeamMember[]
  invitations   Invitation[]

  @@map("users")
}

model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  domain      String?
  defaultRole Role     @default(MEMBER)
  billingId   String?
  billingProvider String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     TeamMember[]
  invitations Invitation[]
  apiKeys     ApiKey[]
  webhooks    Webhook[]

  @@map("teams")
}

model TeamMember {
  id       String @id @default(cuid())
  role     Role   @default(MEMBER)
  accepted Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId   String
  teamId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  team     Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
  @@map("team_members")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```

## Database Setup

### Initial Setup

```bash
# Install Prisma CLI
npm install prisma --save-dev

# Install Prisma Client
npm install @prisma/client

# Initialize Prisma in existing project
npx prisma init

# Generate Prisma Client
npx prisma generate
```

### Database Migrations

```bash
# Create and apply a new migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Database Seeding

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  });

  // Create sample team
  const team = await prisma.team.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      members: {
        create: [
          {
            userId: user1.id,
            role: 'OWNER',
            accepted: true,
          },
          {
            userId: user2.id,
            role: 'MEMBER',
            accepted: true,
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seeding:

```bash
npx prisma db seed
```

## Prisma Client Usage

### Client Initialization

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Basic CRUD Operations

```typescript
import { prisma } from '@/lib/prisma';

// Create user
async function createUser(data: { email: string; name?: string }) {
  return await prisma.user.create({
    data,
  });
}

// Find user by email
async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      teamMembers: {
        include: {
          team: true,
        },
      },
    },
  });
}

// Update user
async function updateUser(id: string, data: { name?: string; image?: string }) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

// Delete user
async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
  });
}

// Get users with pagination
async function getUsers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}
```

### Complex Queries

```typescript
// Get team with members and their roles
async function getTeamWithMembers(slug: string) {
  return await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          members: true,
          invitations: true,
        },
      },
    },
  });
}

// Search users across teams
async function searchUsers(query: string, teamId?: string) {
  return await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        teamId
          ? {
              teamMembers: {
                some: {
                  teamId,
                },
              },
            }
          : {},
      ],
    },
    include: {
      teamMembers: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// Aggregate queries
async function getTeamStats(teamId: string) {
  const [memberCount, activeMembers, recentActivity] = await Promise.all([
    prisma.teamMember.count({
      where: { teamId },
    }),
    prisma.teamMember.count({
      where: {
        teamId,
        accepted: true,
      },
    }),
    prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalMembers: memberCount,
    activeMembers,
    recentActivity,
  };
}
```

### Transactions

```typescript
// Transfer team ownership
async function transferTeamOwnership(
  teamId: string,
  currentOwnerId: string,
  newOwnerId: string
) {
  return await prisma.$transaction(async (prisma) => {
    // Downgrade current owner to admin
    await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId: currentOwnerId,
          teamId,
        },
      },
      data: { role: 'ADMIN' },
    });

    // Upgrade new member to owner
    await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId: newOwnerId,
          teamId,
        },
      },
      data: { role: 'OWNER' },
    });

    // Log the ownership transfer
    return await prisma.auditLog.create({
      data: {
        action: 'OWNERSHIP_TRANSFERRED',
        teamId,
        userId: currentOwnerId,
        metadata: {
          previousOwner: currentOwnerId,
          newOwner: newOwnerId,
        },
      },
    });
  });
}

// Bulk operations
async function createMultipleInvitations(
  invitations: Array<{
    email: string;
    teamId: string;
    role: Role;
  }>
) {
  return await prisma.$transaction(
    invitations.map((invitation) =>
      prisma.invitation.create({
        data: invitation,
      })
    )
  );
}
```

## Advanced Features

### Connection Pooling

For production applications, configure connection pooling:

```prisma
// In schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

```typescript
// Connection pool configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Database Middleware

```typescript
// Add logging middleware
prisma.$use(async (params, next) => {
  const before = Date.now();

  const result = await next(params);

  const after = Date.now();

  console.log(
    `Query ${params.model}.${params.action} took ${after - before}ms`
  );

  return result;
});

// Add soft delete middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'delete') {
      // Change delete to update
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }

    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Add filter for non-deleted records
      if (!params.args.where) params.args.where = {};
      params.args.where.deletedAt = null;
    }
  }

  return next(params);
});
```

### Raw Queries

```typescript
// Raw SQL queries when needed
async function getUsersWithCustomQuery() {
  return await prisma.$queryRaw`
    SELECT u.*, COUNT(tm.id) as team_count
    FROM users u
    LEFT JOIN team_members tm ON u.id = tm.user_id
    WHERE u.created_at > NOW() - INTERVAL '30 days'
    GROUP BY u.id
    ORDER BY team_count DESC
    LIMIT 10
  `;
}

// Prepared statements
async function getUsersByRole(role: string) {
  return await prisma.$queryRaw`
    SELECT DISTINCT u.*
    FROM users u
    JOIN team_members tm ON u.id = tm.user_id
    WHERE tm.role = ${role}
  `;
}
```

## Model Relationships

### One-to-Many

```prisma
model User {
  id    String @id @default(cuid())
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

### Many-to-Many

```prisma
model User {
  id    String @id @default(cuid())
  roles UserRole[]
}

model Role {
  id    String @id @default(cuid())
  users UserRole[]
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}
```

### Self-Relations

```prisma
model Category {
  id       String     @id @default(cuid())
  name     String
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
}
```

## Performance Optimization

### Query Optimization

```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// Use include for relations
const usersWithTeams = await prisma.user.findMany({
  include: {
    teamMembers: {
      include: {
        team: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    },
  },
});

// Batch queries
const [users, teams, invitations] = await Promise.all([
  prisma.user.findMany(),
  prisma.team.findMany(),
  prisma.invitation.findMany(),
]);
```

### Indexing

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?

  @@index([name]) // Single field index
  @@index([email, name]) // Compound index
}

model TeamMember {
  userId String
  teamId String
  role   Role

  @@unique([userId, teamId])
  @@index([teamId, role]) // For filtering by team and role
}
```

## Testing

### Test Database Setup

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export async function resetDatabase() {
  // Clean up test data
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma };
```

### Test Utilities

```typescript
// tests/helpers/database.ts
import { prisma } from './setup';

export async function createTestUser(overrides = {}) {
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    },
  });
}

export async function createTestTeam(userId: string, overrides = {}) {
  return await prisma.team.create({
    data: {
      name: 'Test Team',
      slug: 'test-team',
      members: {
        create: {
          userId,
          role: 'OWNER',
          accepted: true,
        },
      },
      ...overrides,
    },
  });
}
```

## Error Handling

### Common Prisma Errors

```typescript
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { error: 'A record with this value already exists' };
      case 'P2025':
        return { error: 'Record not found' };
      case 'P2003':
        return { error: 'Foreign key constraint failed' };
      default:
        return { error: 'Database error occurred' };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { error: 'Invalid data provided' };
  }

  return { error: 'An unexpected error occurred' };
}

// Usage in API routes
try {
  const user = await prisma.user.create({ data: userData });
  return user;
} catch (error) {
  const { error: errorMessage } = handlePrismaError(error);
  throw new Error(errorMessage);
}
```

## Deployment

### Production Considerations

```bash
# Generate client for production
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optimize for production
npm run build
```

### Environment-Specific Configurations

```prisma
// Different configurations per environment
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Use connection pooling in production
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
  // Enable preview features for edge runtime
  previewFeatures = ["driverAdapters"]
}
```

## CLI Commands

### Useful Prisma Commands

```bash
# Schema management
npx prisma db pull          # Pull schema from database
npx prisma db push          # Push schema to database
npx prisma generate         # Generate Prisma Client

# Migrations
npx prisma migrate dev      # Create and apply migration (dev)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma migrate status   # Check migration status
npx prisma migrate reset    # Reset database (dev only)

# Database utilities
npx prisma studio          # Launch Prisma Studio
npx prisma format          # Format schema file
npx prisma validate        # Validate schema file

# Debugging
npx prisma debug           # Show debug information
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Database Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Prisma Studio](https://www.prisma.io/studio)
