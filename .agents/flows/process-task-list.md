# Task List Management with Session Persistence

Guidelines for managing task lists in markdown files to track progress on completing a PRD, with built-in session management for Claude Code.

## Session Management

### Starting Work (First Time or Resuming)

Before beginning any task work, the AI must:

1. **Read the existing task file** using the Read tool to understand current state
2. **Import task state** into Claude Code's TodoWrite system:
   - Extract all incomplete tasks from the markdown file
   - Create corresponding todos with proper priority and status
   - Identify the next available task (first unchecked task without incomplete dependencies)
3. **Show current progress** to the user:
   - Summary of completed vs. pending tasks
   - Current task in progress (if any)
   - Next recommended task to work on
4. **Ask for confirmation** before proceeding with work

### During Work
- **Dual updates**: When completing tasks, update BOTH:
  - The markdown file (change `[ ]` to `[x]`)
  - Claude Code's TodoWrite system (mark as completed)
- **Maintain sync**: Keep both the ToDoWrite system and the markdown file aligned throughout the session
- **Use subagents:** When multiple tasks can be performed in parallel and are not dependent on each other.

### Context Recovery
When resuming work after time away, provide a status report:
```
## Session Resume Report
**Project**: [Feature name from PRD]
**Total Tasks**: X parent tasks, Y sub-tasks
**Completed**: Z tasks done
**Current Status**: Working on task X.Y
**Next Available**: Task A.B is ready to start
**Blocked Tasks**: Task C.D waiting on task E.F
```

## Scope Management

### Primary Focus: Required Tasks Only
- **Execute only the tasks in the list** - do not add features or optimizations during implementation
- **Minimize code changes** - prefer modifying existing code over creating new files
- **Preserve existing functionality** - never remove or modify existing features without explicit user approval
- **Track scope expansion** - if a task requires more work than expected, stop and ask for user guidance

### Handling Discovered Improvements
When encountering potential optimizations or improvements during work:
1. **Complete the current task first** using the simplest approach
2. **Document the improvement** in the "Proposed Changes" section
3. **Continue with required tasks** - do not implement improvements immediately
4. **Present all proposals** to the user only after completing all required tasks

### Decision Points for Scope Expansion
Stop work and ask for user guidance when:
- A task requires creating more than 2 new files
- Implementation requires significant refactoring of existing code
- Dependencies or technical constraints emerge that weren't anticipated
- The approach would modify existing functionality beyond the task scope

## Task Implementation
- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y"
- **Scope discipline**: Implement only what the task requires - no additional features or optimizations
- **Minimal changes**: Use the simplest approach that accomplishes the task goal
- **Preserve existing code**: Modify existing files rather than creating new ones when possible
- **Session-aware startup**: Always begin by reading the task file and importing state
- **Completion protocol:**  
  1. When you finish a **sub‑task**:
     - Mark it as completed in the markdown file (`[ ]` to `[x]`)
     - Update Claude Code's TodoWrite system
     - Save the markdown file
  2. If **all** subtasks underneath a parent task are now `[x]`, follow this sequence:
    - **First**: Run the full test suite (`pytest`, `npm test`, `bin/rails test`, etc.)
    - **Scope validation**: Confirm changes address only the required task - no additional features added
    - **Only if all tests pass**: Stage changes (`git add .`)
    - **Clean up**: Remove any temporary files and temporary code before committing
    - **Commit**: Use a descriptive commit message that:
      - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
      - Summarizes what was accomplished in the parent task
      - Lists key changes and additions
      - References the task number and PRD context
      - **Formats the message as a single-line command using `-m` flags**
  3. Once all subtasks are marked completed and changes committed:
     - Mark the **parent task** as completed in both systems
     - Update the markdown file
- **Session persistence**: After each task completion, save progress to ensure resumability

## Task List Maintenance

1. **Update the task list as you work:**
   - Mark tasks and subtasks as completed (`[x]`) per the protocol above
   - Add new tasks as they emerge
   - Keep both markdown and Claude Code systems in sync

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified
   - Give each file a one‑line description of its purpose
   - Update as new files are discovered during implementation

## Proposed Changes Tracking

Maintain a "Proposed Changes" section at the end of the task list file:

```markdown
## Proposed Changes (For Future Consideration)

- **Performance Optimization**: [Description] - Discovered while working on task X.Y
- **Code Refactoring**: [Description] - Could simplify maintenance in [file]
- **Feature Enhancement**: [Description] - Would improve user experience
```

**Rules for Proposed Changes:**
- Only add after completing the current task
- Include context about when/why it was discovered
- Reference the task number where it was found
- Present to user only after all required tasks are complete

## AI Instructions for Session Management

When working with task lists, the AI must:

1. **Immediately read the task file** before any work begins
2. **Import all incomplete tasks** into Claude Code's TodoWrite system with correct status
3. **Provide session context** when resuming work
4. **Maintain dual state** in both markdown files and Claude Code todos
5. **Follow the completion protocol** for both systems
6. **Add all newly discovered tasks** to both systems
7. **Keep "Relevant Files" section current** and list all created/modified files with one-line descriptions
8. **Before starting work**, identify the next sub‑task and confirm with user
9. **Maintain scope discipline** - implement only required tasks, document improvements for later consideration
10. **Update task file immediately after finishing any sub‑task** mark [x] and save file
11. **Save progress regularly** to ensure session resumability
12. **Mark parent task [x]** only when all sub-tasks are [x]

## Example Session Startup

```
I've read the task file `/tasks/tasks-prd-user-profile-settings.md`. Here's the current status:

**Completed and Pending:**
- 3 tasks and 9 sub-tasks complete || 4 tasks and 15 sub-tasks remaining

**Completed Tasks:**
- [x] 4.1 Create ProfileSettings component with form fields

**In Progress:**
- [ ] 4.2 Add form validation for name and email (next to work on)

I've imported the incomplete tasks into my todo system. Ready to continue with task 4.2?
```