# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

## Process

1. **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2. **Mandatory Deep Codebase Analysis:** Before asking questions, analyze existing codebase including files mentioned, architectural patterns, hardcoded values, and current testing coverage.
3. **Ask Clarifying Questions:** Before writing the PRD, the AI must ask clarifying questions to understand the feature's "what" (functionality/scope) and "why" (problem solved/goals). Do not focus on "how" (implementation details). Ask at least 3 questions covering: Problem/Goal, User Stories, Scope, and Success Metrics. Provide numbered/lettered options for easy user response.
4. **Review and Simplify:** Before generating the PRD, challenge complexity assumptions and identify the simplest viable solution. Strip requirements to core value-delivering functionality.
5. **Generate PRD:** Based on the initial prompt, clarifying answers, and simplification review, generate a PRD using the structure outlined below.
6. **Save PRD:** Save the generated document as `prd-[feature-name].md` inside the `/tasks` directory.
7. **Validate PRD against the codebase:** Before finalizing, verify proposed approach against actual codebase for reasonableness and feasibility and architectural conflicts. Update the PRD as needed.

## Clarifying Questions (Examples)

The AI should adapt its questions based on the prompt, but here are some common areas to explore:

*   **Problem/Goal:** "What problem does this feature solve for the user?" or "What is the main goal we want to achieve with this feature?"
*   **Target User:** "Who is the primary user of this feature?"
*   **Core Functionality:** "Can you describe the key actions a user should be able to perform with this feature?"
*   **User Stories:** "Could you provide a few user stories? (e.g., As a [type of user], I want to [perform an action] so that [benefit].)"
*   **Acceptance Criteria:** "How will we know when this feature is successfully implemented? What are the key success criteria?"
*   **Scope/Boundaries:** "Are there any specific things this feature *should not* do (non-goals)?"
*   **Data Requirements:** "What kind of data does this feature need to display or manipulate?"
*   **Design/UI:** "Are there any existing design mockups or UI guidelines to follow?" or "Can you describe the desired look and feel?"
*   **Edge Cases:** "Are there any potential edge cases or error conditions we should consider?"
*   **Simplification:** "What's the simplest way to achieve this core goal?" and "Could this be built using existing components?"
*   **Scope Reduction:** "What's the minimum viable version that delivers value?" and "Which parts could be deferred to v2?"

## PRD Structure

The generated PRD must follow this structure exactly. Each section must meet these criteria:

1. **Introduction/Overview:** Describe the feature, problem solved, and one specific goal statement.
2. **Goals:** List 3-5 specific, measurable objectives using action verbs.
3. **User Stories:** Minimum 3 stories using format: "As a [user type], I want to [action] so that [benefit]".
4. **Functional Requirements:** List numbered, testable functionalities using imperative language ("The system must...", "Users shall be able to...").
5. **Implementation Approach:** Describe the simplest technical approach. Must justify any complexity and list simpler alternatives considered.
6. **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.
7. **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements, or mention relevant components/styles if applicable.
8. **Technical Considerations (Optional):** Mention any known technical constraints, dependencies, or suggestions (e.g., "Should integrate with the existing Auth module").
9. **Success Metrics:** How will the success of this feature be measured? (e.g., "Increase user engagement by 10%", "Reduce support tickets related to X").
10. **Open Questions:** List any remaining questions or areas needing further clarification.
11. **Implementation Risks:** Document potential breaking changes, architectural conflicts, or technical debt implications.

## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.

## Output

*   **Format:** Markdown (`.md`)
*   **Location:** `/tasks/`
*   **Filename:** `prd-[feature-name].md`

## Final instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Review answers and challenge complexity before writing PRD
4. Take the user's answers and simplification review to generate the PRD