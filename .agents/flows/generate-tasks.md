# Rule: Generating a Test-Aware Task List from a PRD

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on an existing Product Requirements Document (PRD). The task list emphasizes practical testing throughout development, ensuring robust and maintainable code.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/features/`
- **Filename:** `feat-[prd-file-name].md` (e.g., `feat-prd-user-profile-editing.md`)

## Process

1. **Receive PRD Reference:** The user points the AI to a specific PRD file
2. **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3. **Assess Current State:** Strictly follow the 'Required Analysis Steps' below to thoroughly assess the existing codebase. Identify all existing components, features, files, and utilities that are relevant to the PRD requirements and can be leveraged or need modification.
4. **Existing Codebase Reality Check:** Count existing test files, assess realistic vs idealistic coverage, identify hardcoded references throughout codebase.
5. **Phase 1: Generate Parent Tasks:** Based on the PRD analysis and current state assessment, create the file and generate the main, 3-6 high-level tasks that implement the feature with minimal code changes. Present these to the user without sub-tasks, then prompt: "I have generated the high-level tasks. Ready to generate sub-tasks? Respond with 'Go' to proceed."
   5.1. **Validate Parent Tasks:** Before generating sub-tasks, verify parent tasks against architectural constraints and existing patterns.
6. **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
7. **Phase 2: Generate Sub-Tasks:** Upon user confirmation, for each parent task, break it down into small, single-action sub-tasks. Sub-tasks must:
   7.1. Follow logical sequence to complete the parent task
   7.2. Cover all PRD implementation details
   7.3. Use existing components/patterns from codebase analysis
   7.4. Justify any new file creation within the sub-task description, explaining why modification of an existing file was not feasible or less appropriate.
8. **Identify Relevant Files:** List every file that will be created or modified based on tasks and PRD. For each source code file, include its corresponding test file. Provide one-line descriptions for each file (e.g., "Contains main user profile component," "Unit tests for loginService.ts").
9. **Generate Final Output:** Combine the parent tasks, sub-tasks, relevant files, and testing notes into the final Markdown structure.
10. **Save Task List:** Save the generated document in the `/features/` directory with the filename `feat-[prd-name].md`.

## Simplification Principles

When generating tasks, follow these principles:

1. **Prioritize Refactoring Over New Code:** Always prefer modifying existing files over creating new ones
2. **Reuse Existing Patterns:** Follow established conventions and patterns found in the codebase
3. **Minimal Changes Approach:** Make the smallest possible changes to achieve the goal
4. **Preserve Existing Functionality:** Never remove or modify existing functionality without explicit user approval
5. **Leverage Existing Components:** Reuse existing UI components, utilities, and services where possible

## Testing-Aware Development Principles

When generating tasks, follow these practical testing principles:

1. **Follow Existing Patterns:** Use established testing patterns found in the codebase
2. **Test Critical Paths:** Ensure tests cover main functionality and error scenarios
3. **Incremental Development:** Build features in small, testable increments
4. **Maintain Quality:** Keep existing tests passing while adding new functionality
5. **Testing Reality Check:** Match testing scope to existing codebase patterns. Do not generate comprehensive tests for minimally-tested codebases.
6. **Pattern Consistency:** Follow existing component, hook, and utility patterns

## Required Analysis Steps

Before generating tasks, the AI must:

- Examine existing test files and testing patterns
- Identify test utilities, mocks, and helper functions available
- Understand current testing framework configuration (Jest, React Testing Library, etc.)
- Map PRD requirements to testable behaviors
- Plan test scenarios covering critical happy path, edge cases, and error conditions
- Focus on testing behavior that matters to users, not every possible edge case

## Output Format

The generated task list _must_ follow this structure:

```markdown
### Relevant Files for Implementation

- `path/to/component.tsx` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/api.ts` - Brief description (e.g., API route handler for data submission).
- `path/to/utils.ts` - Brief description (e.g., Utility functions needed for calculations).

### Relevant Files for Testing

- `path/to/component.test.tsx` - Unit tests for `component.tsx`.
- `path/to/api.test.ts` - Unit tests for `api.ts`.
- `path/to/utils.test.ts` - Unit tests for `utils.ts`.
- `__mocks__/mockData.ts` - Mock data for testing
- `__tests__/setup.ts` - Test setup and configuration

### Notes for Developer

- Adhere to existing code patterns and conventions found in the codebase.
- Use established test utilities and patterns found in the codebase
- Unit tests should typically be placed alongside the code files they are testing (e.g., MyComponent.tsx and MyComponent.test.tsx).
- To run tests, use npx jest [optional/path/to/test/file].
- Always prioritize modifying existing files over creating new ones.
- Justify any new file creation within the corresponding task description.
- Consider adding refactoring tasks when they improve simplification or maintainability.
- **Terminology Precision Guidelines:** Use accurate technical terms: 'Configuration update' vs 'migration', 'Refactor' vs 'rewrite', 'Update references' vs 'create new system'.

## Tasks

- [ ] 1.0 Parent Task Title
  - [ ] 1.1 Implement [specific functionality] following existing patterns
  - [ ] 1.2 Add or update tests for core functionality and edge cases
  - [ ] 1.3 Refactor for clarity and consistency if needed
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 Create [API/service] functionality with error handling
  - [ ] 2.2 Add or update integration tests covering main workflows
  - [ ] 2.3 Update related components to use new functionality
- [ ] 3.0 Parent Task Title
  - [ ] 3.1 Connect user-facing components and complete workflow
  - [ ] 3.2 Add or update end-to-end tests for critical user paths
  - [ ] 3.3 Verify all tests pass and clean up implementation
```

## Testing-Aware Task Structure

Each parent task should follow this practical pattern:

### Implementation Tasks

- Implement core functionality following existing codebase patterns
- Build on existing components, hooks, and utilities where possible
- Include proper error handling and edge case considerations
- Maintain consistency with current code style and architecture

### Testing Tasks

- Add or update tests for core functionality and edge cases
- Test both success scenarios and error conditions
- Follow existing test patterns and utilities
- Ensure integration with current testing infrastructure

### Quality Tasks

- Refactor for clarity and maintainability if needed
- Verify all existing tests continue to pass
- Update related documentation or types as needed
- Confirm feature works end-to-end in development environment

## Interaction Model

The process explicitly requires a pause after generating parent tasks to get user confirmation ("Go") before proceeding to generate the detailed sub-tasks. This ensures the high-level plan aligns with user expectations and existing codebase patterns.

## Target Audience

Assume the primary reader of the task list is a **junior developer** who will implement the feature following practical development practices with good testing habits, using existing codebase patterns as guidance.
