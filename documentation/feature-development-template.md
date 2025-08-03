# Current Feature Development Process

This document outlines the current approach for adding new features to the SaaS Starter Kit using the agent-based development system.

## Development Workflow Overview

The platform uses a three-tier agent system to handle feature development of varying complexity levels:

### 1. Simple Changes (@quick-implement)

For straightforward 1-3 file changes with minimal ceremony:

- Direct implementation without extensive planning
- Bug fixes and style changes
- Component updates and minor enhancements

### 2. Medium Complexity (@structured-work)

For multi-component features requiring structured task execution:

- Uses PRD creation → task generation → execution workflow
- Features affecting 5-15 files
- Multi-step/phase implementations
- Changes affecting several related systems

### 3. Complex Features (@add-feature)

For comprehensive features requiring architectural planning:

- Uses 5-pass iterative refinement process
- New systems and complex integrations
- Features requiring architectural decisions
- Cross-system integration requirements

## Agent-Based Feature Development

### Quick Implementation Agent

**Usage**: `@quick-implement [feature description]`

Handles simple changes with minimal overhead:

- Direct code implementation
- Basic testing verification
- Immediate execution without planning phases

### Structured Work Agent

**Usage**: `@structured-work [feature description]`

Follows this workflow:

1. **PRD Creation**: Analyze codebase and generate structured Product Requirements Document
2. **Task Generation**: Break down into parent tasks and detailed sub-tasks
3. **Execution**: Session-managed implementation with progress tracking

Files are saved in `/features/` directory:

- `prd-[feature-name].md` - Product Requirements Document
- `tasks-prd-[feature-name].md` - Generated task breakdown

### Add Feature Agent

**Usage**: `@add-feature [feature description]`

Comprehensive 5-pass iterative refinement:

#### Pass 1: High-Level Feature Concept

- Problem understanding and scope definition
- Core functionality identification
- User context analysis

#### Pass 2: Codebase Reality Check

- Pattern matching with existing features
- Technical constraint discovery
- Architecture alignment

#### Pass 3: Feature Specification Refinement

- Data model approach selection
- Permission and UI pattern definition
- API design confirmation

#### Pass 4: Incremental Implementation Planning

- MVP definition and phase breakdown
- Dependency analysis and sequencing
- Risk assessment and mitigation

#### Pass 5: Technical Validation

- Comprehensive technical review
- Integration point validation
- Final implementation readiness

Files are saved in `/features/` directory with descriptive naming.

## File Organization

### Generated Work Directory: `/features/`

All agent-generated documentation and planning files:

- Feature specifications and implementation guides
- PRDs and task breakdowns
- Progress tracking and session state

### Template Directory: `/.agents/flows/`

Agent workflow templates and frameworks:

- `create-prd.md` - PRD creation workflow
- `generate-tasks.md` - Task generation process
- `process-task-list.md` - Session-managed execution
- `iterative-feature-template.md` - Conversational templates
- `multi-pass-refinement-framework.md` - 5-pass refinement system

## Development Commands

After feature implementation, always run:

- `npm run check-types` - TypeScript validation
- `npm run check-lint` - Code quality checks
- `npm run check-format` - Code formatting
- `npm run test-all` - Complete test suite
- `npm run build` - Production build verification

## Best Practices

### Choosing the Right Agent

**Use @quick-implement for**:

- Single file updates
- Bug fixes and style changes
- Component modifications
- Configuration updates

**Use @structured-work for**:

- Multi-component features
- Features needing planning but not architectural review
- User stories requiring task breakdown
- Medium complexity integrations

**Use @add-feature for**:

- New system architectures
- Complex integrations
- Features requiring deep codebase analysis
- Multi-phase implementations with dependencies

### Implementation Guidelines

1. **Follow Existing Patterns**: Always analyze current codebase patterns before implementing
2. **Multi-tenant Architecture**: Ensure team-scoped data isolation
3. **Permission-Based Access**: Implement role-based access control
4. **Audit Logging**: Include comprehensive activity tracking
5. **Feature Flags**: Use environment-based feature toggles
6. **Progressive Enhancement**: Build MVP first, then add enhancements

### Session Management

The structured workflow agents support resumable sessions:

- Work can be interrupted and resumed
- Progress is tracked in both markdown files and TodoWrite system
- Session state maintains context across interactions
- Each sub-task requires user permission before execution

## Framework Integration

### Multi-Tenant Architecture

- Team-scoped data models with `teamId` foreign keys
- Team-slug based API routing: `/api/teams/[slug]/resource`
- Permission checks at both API and UI levels

### Database Patterns

- Audit fields: `createdAt`, `updatedAt`, `createdById`, `updatedById`
- Soft deletion with status fields where appropriate
- Proper indexing for team-scoped queries

### API Design Patterns

- Consistent validation using Zod schemas
- Standard error handling and responses
- Team permission middleware integration
- Webhook event emission for CRUD operations

### Frontend Patterns

- Permission-aware UI components
- Consistent table/list/form patterns
- Loading states and error handling
- Search and pagination capabilities

This agent-based system ensures consistent, high-quality feature development while maintaining the platform's architectural patterns and security requirements.
