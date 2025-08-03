# Deployment Architecture

## Overview

The SaaS Starter Kit supports multiple deployment patterns from simple single-server deployments to highly available cloud-native architectures. The deployment strategy emphasizes simplicity while providing paths for scaling as the application grows.

## Deployment Patterns

### Pattern 1: Development Environment

```mermaid
graph TD
    subgraph "Developer Machine"
        A[Next.js Dev Server<br/>Port 4002]
        B[PostgreSQL Docker<br/>Port 5432]
        C[Local SMTP<br/>Port 1025]
    end
    
    subgraph "External Services"
        D[GitHub OAuth<br/>Test App]
        E[Stripe Test Mode]
        F[Sentry Development]
    end
    
    A --> B
    A --> D
    A --> E
    A --> F
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
```

**Development Setup**:
- **Application**: Local Next.js development server with hot reloading
- **Database**: Docker Compose PostgreSQL container with persistent volumes
- **Email**: Local SMTP server (Mailhog) or email service test mode
- **External services**: Test/sandbox mode for all third-party integrations

**Commands**:
```bash
# Start development environment
docker-compose up -d          # PostgreSQL database
npm run dev                   # Next.js development server
npx prisma db push           # Database schema setup
```

### Pattern 2: Single Server Deployment

```mermaid
graph TD
    subgraph "Single Server"
        A[Nginx Reverse Proxy<br/>Port 80/443]
        B[Next.js Application<br/>Port 4002]
        C[PostgreSQL<br/>Port 5432]
        D[Redis Cache<br/>Port 6379]
    end
    
    subgraph "External Services"
        E[Stripe Production]
        F[Email Provider]
        G[Monitoring Services]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    
    style A fill:#ffebee
    style B fill:#e3f2fd
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

**Characteristics**:
- **Suitable for**: Small to medium applications (< 10,000 users)
- **Infrastructure**: Single VPS or dedicated server
- **High availability**: Limited - single point of failure
- **Scaling**: Vertical scaling only
- **Cost**: Low operational costs

**Deployment Configuration**:
```dockerfile
# Production Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 4002
CMD ["npm", "start"]
```

### Pattern 3: Container Orchestration (Kubernetes)

```mermaid
graph TD
    subgraph "Kubernetes Cluster"
        subgraph "Ingress"
            A[NGINX Ingress Controller]
            B[TLS Termination]
        end
        
        subgraph "Application Tier"
            C[Next.js Pods x3]
            D[HPA Controller]
        end
        
        subgraph "Data Tier"
            E[PostgreSQL StatefulSet]
            F[Redis Deployment]
            G[Persistent Volumes]
        end
        
        subgraph "Monitoring"
            H[Prometheus]
            I[Grafana]
            J[Jaeger Tracing]
        end
    end
    
    A --> C
    D --> C
    C --> E
    C --> F
    E --> G
    F --> G
    C --> H
    
    style A fill:#ffebee
    style C fill:#e3f2fd
    style E fill:#e8f5e8
    style H fill:#f3e5f5
```

**Characteristics**:
- **Suitable for**: Large applications with high availability requirements
- **Infrastructure**: Multi-node Kubernetes cluster
- **High availability**: Multi-zone deployment with automatic failover
- **Scaling**: Horizontal and vertical auto-scaling
- **Cost**: Higher operational complexity and costs

**Kubernetes Manifests**:
```yaml
# app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saas-starter-kit
spec:
  replicas: 3
  selector:
    matchLabels:
      app: saas-starter-kit
  template:
    metadata:
      labels:
        app: saas-starter-kit
    spec:
      containers:
      - name: app
        image: saas-starter-kit:latest
        ports:
        - containerPort: 4002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: saas-starter-kit-service
spec:
  selector:
    app: saas-starter-kit
  ports:
  - port: 80
    targetPort: 4002
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: saas-starter-kit-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: saas-starter-kit
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Pattern 4: Cloud-Native Architecture

```mermaid
graph TD
    subgraph "Cloud Provider (AWS/GCP/Azure)"
        subgraph "Load Balancing"
            A[Application Load Balancer]
            B[Auto Scaling Group]
        end
        
        subgraph "Compute"
            C[ECS/Cloud Run<br/>Container Instances]
            D[Auto Scaling Policies]
        end
        
        subgraph "Data Services"
            E[RDS PostgreSQL<br/>Multi-AZ]
            F[ElastiCache Redis]
            G[S3/Cloud Storage]
        end
        
        subgraph "Monitoring & Logging"
            H[CloudWatch/Stackdriver]
            I[Application Insights]
        end
    end
    
    A --> C
    B --> C
    D --> C
    C --> E
    C --> F
    C --> G
    C --> H
    
    style A fill:#ffebee
    style C fill:#e3f2fd
    style E fill:#e8f5e8
    style H fill:#f3e5f5
```

**Characteristics**:
- **Suitable for**: Enterprise applications with strict SLA requirements
- **Infrastructure**: Managed cloud services with high availability
- **High availability**: Multi-region deployment capabilities
- **Scaling**: Automatic scaling based on metrics and schedules
- **Cost**: Pay-as-you-scale with managed service premiums

## Infrastructure Components

### Load Balancing and Traffic Management

#### Application Load Balancer Configuration
```nginx
# nginx.conf for reverse proxy
upstream nextjs_backend {
    server app1:4002 weight=1 max_fails=3 fail_timeout=30s;
    server app2:4002 weight=1 max_fails=3 fail_timeout=30s;
    server app3:4002 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Proxy Configuration
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static asset caching
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Database Deployment Strategies

#### Single Database Instance
```yaml
# docker-compose.yml for development
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: saas_starter_kit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

#### High Availability Database (RDS/Cloud SQL)
```terraform
# terraform/database.tf
resource "aws_db_instance" "postgres" {
  identifier     = "saas-starter-kit-db"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.r6g.large"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "saas_starter_kit"
  username = "postgres"
  password = var.db_password
  
  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
  
  skip_final_snapshot = false
  final_snapshot_identifier = "saas-starter-kit-final-snapshot"
  
  tags = {
    Name = "SaaS Starter Kit Database"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "saas-starter-kit-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "SaaS Starter Kit DB subnet group"
  }
}
```

### Caching Infrastructure

#### Redis Deployment
```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --appendonly yes
        - --maxmemory 256mb
        - --maxmemory-policy allkeys-lru
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
      volumes:
      - name: redis-data
        persistentVolumeClaim:
          claimName: redis-pvc
```

## Environment Configuration

### Development Environment Variables
```bash
# .env.local
NODE_ENV=development
NEXTAUTH_URL=http://localhost:4002
NEXTAUTH_SECRET=development-secret

DATABASE_URL=postgresql://postgres:password@localhost:5432/saas_starter_kit

# Authentication providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External services (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=

# Monitoring (development)
SENTRY_DSN=https://your-sentry-dsn
MIXPANEL_TOKEN=your_mixpanel_token
```

### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=secure-random-secret

DATABASE_URL=postgresql://user:password@prod-db:5432/saas_starter_kit
REDIS_URL=redis://redis-server:6379

# Authentication providers (production apps)
GITHUB_CLIENT_ID=prod_github_client_id
GITHUB_CLIENT_SECRET=prod_github_client_secret
GOOGLE_CLIENT_ID=prod_google_client_id
GOOGLE_CLIENT_SECRET=prod_google_client_secret

# External services (production)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Monitoring (production)
SENTRY_DSN=https://prod-sentry-dsn
MIXPANEL_TOKEN=prod_mixpanel_token
RETRACED_API_KEY=your_retraced_api_key

# Security
ENABLE_RECAPTCHA=true
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

## Monitoring and Observability

### Health Checks
```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    
    // External service health checks
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    };
    
    res.status(200).json(checks);
  } catch (error) {
    res.status(503).json({
      database: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Logging Configuration
```typescript
// lib/logger.ts
import winston from 'winston';
import { Sentry } from '@sentry/nextjs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

### Metrics Collection
```typescript
// lib/metrics.ts
import { metrics } from '@opentelemetry/api-metrics';

const meter = metrics.getMeter('saas-starter-kit');

export const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests'
});

export const requestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds'
});

export const activeUsers = meter.createUpDownCounter('active_users', {
  description: 'Number of active users'
});
```

## Security Considerations

### Network Security
- **TLS termination**: SSL/TLS certificates with automatic renewal
- **Security headers**: CSP, HSTS, X-Frame-Options via middleware
- **Rate limiting**: Application-level and infrastructure-level protection
- **DDoS protection**: Cloud provider DDoS protection services

### Application Security
- **Secrets management**: Environment variables with secure storage
- **Database security**: Connection encryption, credential rotation
- **API security**: Authentication, authorization, input validation
- **Dependency scanning**: Regular security audits of npm packages

### Infrastructure Security
- **Network isolation**: VPC/private networks for database access
- **Access control**: IAM roles and policies for cloud resources
- **Audit logging**: Infrastructure and application audit trails
- **Backup encryption**: Encrypted backups with secure key management

## Disaster Recovery

### Backup Strategy
```bash
#!/bin/bash
# backup.sh - Database backup script

DB_NAME="saas_starter_kit"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### Recovery Procedures
1. **Database recovery**: Restore from latest backup with point-in-time recovery
2. **Application recovery**: Redeploy from source control with configuration
3. **Data verification**: Validate data integrity after recovery
4. **Service restoration**: Gradually restore services and verify functionality

## Performance Optimization

### Application Performance
- **Code splitting**: Automatic code splitting with Next.js
- **Image optimization**: Next.js Image component with WebP
- **Caching strategy**: SWR for client-side caching, Redis for server-side
- **Bundle analysis**: Regular bundle size monitoring and optimization

### Database Performance
- **Query optimization**: Index optimization and query analysis
- **Connection pooling**: Prisma connection pooling configuration
- **Read replicas**: Separate read operations to reduce load
- **Query monitoring**: Slow query detection and optimization

### Infrastructure Performance
- **CDN integration**: CloudFront/CloudFlare for static asset delivery
- **Geographic distribution**: Multi-region deployment for global users
- **Auto-scaling**: CPU and memory-based scaling policies
- **Load balancing**: Intelligent routing based on server health and load