# Multi-Pass Refinement Framework

## Overview

This framework defines how the feature development sub-agent manages conversational state and progresses through multiple refinement passes to build a complete understanding of the feature requirements and implementation approach.

## Conversational State Structure

The sub-agent maintains this state structure throughout the conversation:

```json
{
  "currentPass": 1,
  "featureRequest": "original user request",
  "concept": {
    "problem": "what problem this solves",
    "scope": "high-level scope boundaries", 
    "coreFunction": "primary functionality needed",
    "users": "who will use this feature"
  },
  "codebaseAnalysis": {
    "similarPatterns": ["existing features that are similar"],
    "applicableModels": ["database models that could be referenced"],
    "uiPatterns": ["UI components that could be reused"],
    "apiPatterns": ["API route patterns that apply"],
    "permissionPatterns": ["permission patterns that apply"],
    "constraints": ["technical limitations discovered"]
  },
  "specifications": {
    "dataModel": "chosen data modeling approach",
    "permissions": "selected permission pattern",
    "uiApproach": "selected UI pattern", 
    "apiDesign": "selected API design pattern",
    "integrations": "external integration needs"
  },
  "implementationPlan": {
    "mvpPhase": {
      "scope": "what's included in MVP",
      "estimate": "estimated effort",
      "dependencies": ["what needs to be built first"]
    },
    "enhancementPhases": [
      {
        "name": "phase name",
        "scope": "what's included",
        "estimate": "estimated effort",
        "dependencies": ["dependencies"]
      }
    ],
    "currentPhase": "which phase is being planned"
  },
  "validationStatus": {
    "dataModelValidated": false,
    "apiDesignValidated": false,
    "uiPatternValidated": false,
    "permissionsValidated": false,
    "integrationsValidated": false
  },
  "userDecisions": {
    "key decisions made by user with context"
  },
  "nextQuestions": ["specific questions to ask in next interaction"]
}
```

## Pass-by-Pass Framework

### Pass 1: High-Level Feature Concept

**Goal**: Understand the basic intent and scope
**State Updates**: Fill in `concept` object
**Question Types**: Open-ended, exploratory

#### Question Framework:
```
1. Problem Understanding:
   - "What problem are you trying to solve with [feature]?"
   - "Who experiences this problem?"
   - "How are they handling this currently?"

2. Scope Boundaries:
   - "Is this focused on [specific area] or broader?"
   - "Should this be available to all team members or restricted?"
   - "Are you thinking simple/complex implementation?"

3. Core Functionality:
   - "What's the most important thing this feature should do?"
   - "What would make this feature successful?"
   - "Are there must-have vs nice-to-have capabilities?"

4. User Context:
   - "Who will be the primary users of this feature?"
   - "Do different users need different capabilities?"
   - "How does this fit into their current workflow?"
```

**Pass 1 Completion Criteria**:
- [ ] Problem clearly understood
- [ ] Scope boundaries defined
- [ ] Core functionality identified
- [ ] Primary users identified
- [ ] Ready for codebase analysis

---

### Pass 2: Codebase Reality Check

**Goal**: Analyze existing patterns and technical constraints
**State Updates**: Fill in `codebaseAnalysis` object
**Process**: Read documentation and examine code patterns

#### Analysis Framework:
```
1. Read Required Documentation:
   - Architecture documentation (all files)
   - Platform documentation
   - API reference
   - Prisma schema
   - Permission system
   - Example API routes
   - Example components

2. Pattern Matching:
   - Find similar existing features
   - Identify applicable data models
   - Match UI patterns
   - Identify API route patterns
   - Find permission patterns

3. Constraint Discovery:
   - Technical limitations
   - Architectural boundaries
   - Performance considerations
   - Security requirements

4. Opportunity Identification:
   - Existing code that can be reused
   - Patterns that fit perfectly
   - Components that can be extended
```

**Pass 2 Output Format**:
```
Based on my codebase analysis, here's what I found relevant to [feature]:

**Existing Patterns I Can Leverage**:
• [Pattern 1]: [How it applies]
• [Pattern 2]: [How it applies]
• [Pattern 3]: [How it applies]

**Similar Features for Reference**:
• [Feature 1]: [Similarity description]
• [Feature 2]: [Similarity description]

**Technical Constraints**:
• [Constraint 1]: [Impact description]
• [Constraint 2]: [Impact description]

**Recommended Approach**:
Based on [concept] and existing patterns, I recommend following the [pattern name] approach because [reasoning].

This means [specific technical approach description].

Does this align with your vision, or should we consider alternative approaches?
```

**Pass 2 Completion Criteria**:
- [ ] Similar patterns identified
- [ ] Technical constraints understood
- [ ] Recommended approach presented
- [ ] User confirms or adjusts approach
- [ ] Ready for detailed specification

---

### Pass 3: Feature Specification Refinement

**Goal**: Define specific behaviors based on codebase capabilities
**State Updates**: Fill in `specifications` object
**Question Types**: Choice-based options referencing actual code patterns

#### Specification Framework:
```
1. Data Model Specification:
   Present options based on existing models:
   - [ ] Simple entity (like ApiKey): [fields it would have]
   - [ ] Complex entity (like TeamMember): [relationships it would have]
   - [ ] Hierarchical entity (new pattern): [structure description]

2. Permission Model Specification:
   Present options based on existing permissions:
   - [ ] Standard CRUD (create/read/update/delete)
   - [ ] Standard CRUD + Export (like existing patterns)
   - [ ] Custom permissions: [specify what's needed]

3. UI Pattern Specification:
   Present options based on existing components:
   - [ ] Table list + detail view (like Teams/Members)
   - [ ] Card grid + modal forms (like API Keys) 
   - [ ] Custom layout: [describe needs]

4. API Design Specification:
   Present options based on existing API patterns:
   - [ ] Standard team-scoped CRUD: /api/teams/[slug]/[resource]
   - [ ] Nested resource: /api/teams/[slug]/[parent]/[resource]
   - [ ] Custom endpoints: [specify special needs]

5. Integration Specification:
   Present options based on existing integrations:
   - [ ] No external integrations needed
   - [ ] Webhook events: [specify event types]
   - [ ] External API integration: [specify service]
```

**Pass 3 Output Format**:
```
Based on your choice of [approach], let me refine the specification:

**Data Model** (following [existing pattern]):
• [Entity] belongs to teams (team_id foreign key)
• Standard audit fields (createdAt, updatedAt, createdBy)
• Core fields: [list specific fields]

**Permissions** (extending existing system):
• [permission:action] permissions following existing patterns
• Role access: [describe who can do what]

**UI Pattern** (reusing existing components):
• [Specific UI pattern] (like [existing feature])
• Components to reuse: [list existing components]

**API Endpoints** (following existing patterns):
• Route structure: [specific routes]
• Validation: [validation approach]

**Refinement Questions**:
1. [Specific question 1]?
2. [Specific question 2]?
3. [Specific question 3]?
```

**Pass 3 Completion Criteria**:
- [ ] Data model approach confirmed
- [ ] Permission model defined
- [ ] UI pattern selected
- [ ] API design confirmed
- [ ] Integration needs specified
- [ ] Ready for implementation planning

---

### Pass 4: Incremental Implementation Planning

**Goal**: Break down into implementable phases
**State Updates**: Fill in `implementationPlan` object
**Process**: Define MVP vs enhancements, sequence dependencies

#### Planning Framework:
```
1. MVP Definition:
   - What's the minimal viable version?
   - What can be built quickly to validate the concept?
   - What are the core dependencies?

2. Enhancement Phases:
   - What features can be added incrementally?
   - How should phases be sequenced?
   - What are the effort estimates?

3. Dependency Analysis:
   - What needs to be built first?
   - What can be built in parallel?
   - What external dependencies exist?

4. Risk Assessment:
   - What could go wrong in each phase?
   - What are the technical risks?
   - How can we mitigate risks?
```

**Pass 4 Output Format**:
```
Here's my proposed incremental implementation:

**Phase 1 - MVP ([scope description])**:
• [Feature 1]: [specific implementation]
• [Feature 2]: [specific implementation] 
• [Feature 3]: [specific implementation]
• Dependencies: [list prerequisites]
• Estimated effort: [time estimate]
• Value delivered: [what user gets]

**Phase 2 - [Enhancement Name]**:
• [Feature 1]: [specific implementation]
• [Feature 2]: [specific implementation]
• Dependencies: Phase 1 + [additional prerequisites]
• Estimated effort: [time estimate]
• Value delivered: [additional user value]

**Phase 3 - [Enhancement Name]**:
• [Similar format]

**Recommended Starting Point**: Phase 1
**Rationale**: [explain why this breakdown makes sense]

Questions:
1. Does Phase 1 deliver enough value to be useful?
2. Should we adjust the phase boundaries?
3. Which phase should we implement first?
```

**Pass 4 Completion Criteria**:
- [ ] MVP clearly defined and scoped
- [ ] Enhancement phases planned
- [ ] Dependencies identified
- [ ] Effort estimated
- [ ] User confirms phase approach
- [ ] Ready for technical validation

---

### Pass 5: Technical Validation

**Goal**: Ensure each implementation step is technically sound
**State Updates**: Fill in `validationStatus` object
**Process**: Validate against existing code patterns

#### Validation Framework:
```
1. Data Model Validation:
   ✅ Follows existing schema patterns
   ✅ Proper foreign key relationships
   ✅ Appropriate indexes for performance
   ✅ Consistent with existing audit fields
   ⚠️ [Any concerns or considerations]

2. API Design Validation:
   ✅ Route structure matches existing patterns
   ✅ Validation schemas follow existing approach
   ✅ Error handling consistent with existing endpoints
   ✅ Permission checks follow established patterns
   ⚠️ [Any concerns or considerations]

3. UI Pattern Validation:
   ✅ Component reuse maximized
   ✅ Existing design system followed
   ✅ Permission-aware UI implemented correctly
   ✅ Navigation integration planned
   ⚠️ [Any concerns or considerations]

4. Integration Validation:
   ✅ External integrations follow existing patterns
   ✅ Webhook events properly defined
   ✅ No breaking changes to existing features
   ✅ Feature flags implemented correctly
   ⚠️ [Any concerns or considerations]

5. Security & Compliance Validation:
   ✅ Multi-tenant isolation maintained
   ✅ Audit logging implemented
   ✅ Data protection requirements met
   ✅ Permission boundaries respected
   ⚠️ [Any concerns or considerations]
```

**Pass 5 Output Format**:
```
Final technical validation for [current phase]:

**Database Model** ✅
• [Validation point 1]
• [Validation point 2]
• [Validation point 3]

**API Endpoints** ✅  
• [Validation point 1]
• [Validation point 2]
• [Validation point 3]

**Frontend Components** ✅
• [Validation point 1]
• [Validation point 2]
• [Validation point 3]

**Integration Points** ✅
• [Validation point 1]
• [Validation point 2]
• [Validation point 3]

**Considerations** ⚠️
• [Important consideration 1]: [explanation]
• [Important consideration 2]: [explanation]

**Final Questions**:
1. [Any remaining clarification needed]?
2. [Any adjustments to the approach]?

Ready to generate the complete implementation guide for [current phase]?
```

**Pass 5 Completion Criteria**:
- [ ] All technical aspects validated
- [ ] No blocking issues identified
- [ ] Considerations documented
- [ ] User confirms readiness
- [ ] Ready to generate implementation guide

---

## State Transition Rules

### Moving Between Passes
```
Pass 1 → Pass 2: When concept is sufficiently understood
Pass 2 → Pass 3: When codebase analysis is complete and approach is confirmed  
Pass 3 → Pass 4: When specifications are refined and confirmed
Pass 4 → Pass 5: When implementation plan is accepted
Pass 5 → Implementation: When all validation is complete

Backward transitions allowed at any point if:
- User wants to change approach
- New constraints are discovered
- Requirements need adjustment
```

### Handling Iteration Within Passes
```
If during any pass:
- User requests changes → Stay in current pass, refine understanding
- New constraints discovered → May need to go back to earlier pass
- Approach doesn't work → Return to Pass 2 for different approach
- Scope changes significantly → May need to restart from Pass 1
```

## Conversation Management

### Starting a New Feature
```
Initial State:
- currentPass: 1
- All objects empty except featureRequest
- Begin with Pass 1 questions

Track: Original request, user responses, decisions made
```

### Continuing a Conversation
```
Resume from current pass:
- Review state to understand where we are
- Summarize progress made so far
- Continue with appropriate questions for current pass

Track: New information, state updates, decision changes
```

### Handling Scope Changes
```
If significant scope change:
- Assess impact on current understanding
- Determine if earlier passes need revisiting
- Update state accordingly
- Restart from appropriate pass

Track: What changed, why, impact on implementation
```

This framework ensures systematic progression through feature refinement while maintaining flexibility for iterative improvement and scope adjustments.