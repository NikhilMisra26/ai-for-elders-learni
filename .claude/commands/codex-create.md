---
name: codex-create
description: Execute tasks using multiple codex CLI instances as subagents with different reasoning levels, similar to Claude Code's subagent system
---

# codex-create

This command orchestrates multiple codex CLI instances as subagents to complete complex tasks. Each codex instance is assigned specific subtasks based on complexity, similar to how Claude Code uses specialized agents.

## Usage

```
/codex-create <task description>
```

Example: `/codex-create fix all linter errors and add missing tests`

## Implementation

When invoked with a task description, execute the following:

### Step 1: Task Analysis and Decomposition

Analyze the task to determine:

1. Complexity level (simple, moderate, complex)
2. Subtasks that can be parallelized
3. Dependencies between subtasks
4. Appropriate reasoning levels for each subtask

### Step 2: Generate Agent-Style Prompts

Create detailed, specific prompts based on the `.claude/agents/` template patterns:

**Template Structure for Each Subagent:**

```
# Context
You are working on: [PROJECT_DESCRIPTION]
Tech stack: [DETECTED_STACK]
Current directory: [WORKING_DIR]

# Your Specific Task
[DETAILED_SUBTASK_DESCRIPTION]

# Instructions
1. [SPECIFIC_STEP_1]
2. [SPECIFIC_STEP_2]
...

# Constraints
- Follow existing code conventions
- Ensure no regressions
- Maintain compatibility
- Write clean, maintainable code

# Deliverables
- [EXPECTED_OUTPUT_1]
- [EXPECTED_OUTPUT_2]

# Validation
After completion, verify:
- [ ] No new errors introduced
- [ ] Tests pass
- [ ] Code follows standards
```

### Step 3: Task-Specific Subagent Assignments

**For "fix linter errors":**

```bash
# Subagent 1: TypeScript errors (high reasoning)
PROMPT_TS="You are a TypeScript specialist.
Current project: $PROJECT_PATH
Task: Fix all TypeScript compilation errors systematically.

Instructions:
1. Run 'pnpm run typecheck' to identify all errors
2. Group errors by type and file
3. Fix type mismatches and missing annotations
4. Add proper return types to all functions
5. Resolve import issues
6. Never use 'any' type or @ts-ignore
7. Run typecheck again to verify

Constraints:
- Maintain type safety
- Follow project's tsconfig.json
- Use existing type definitions

Deliverables:
- All TypeScript errors resolved
- Clean typecheck output"

# Subagent 2: ESLint errors (medium reasoning)
PROMPT_LINT="You are an ESLint specialist.
Current project: $PROJECT_PATH
Task: Fix all ESLint warnings and errors.

Instructions:
1. Run 'pnpm run lint:fix' for auto-fixes
2. Manually fix remaining issues
3. Focus on code quality rules
4. Ensure consistent formatting
5. Verify with final lint run

Deliverables:
- Zero ESLint errors
- Clean lint output"

# Subagent 3: Format and cleanup (low reasoning)
PROMPT_FORMAT="Task: Format and organize imports.

Instructions:
1. Run 'pnpm run format'
2. Organize imports alphabetically
3. Remove unused imports
4. Ensure consistent spacing

Quick and straightforward cleanup task."
```

**For "implement new feature":**

```bash
# Subagent 1: UI Component (high reasoning)
PROMPT_UI="You are a React component architect.
Task: Build [COMPONENT_NAME] with full accessibility.

Requirements:
- TypeScript interfaces for props
- ARIA attributes
- Keyboard navigation
- Responsive design with Tailwind
- Dark mode support
- Focus management

Follow patterns in src/components/"

# Subagent 2: API Integration (medium reasoning)
PROMPT_API="Create API endpoints for [FEATURE].

Tasks:
- Design RESTful endpoints
- Add validation
- Error handling
- Type definitions
- Basic authentication

Use existing patterns in src/lib/api/"

# Subagent 3: Tests (medium reasoning)
PROMPT_TEST="Write comprehensive tests for [FEATURE].

Cover:
- Unit tests for utilities
- Component rendering tests
- API endpoint tests
- Edge cases
- Error scenarios"
```

### Step 4: Execute Parallel Codex Instances

**IMPORTANT**: Use these EXACT commands that have been tested and verified to work:

For Claude Code execution:

1. Use the Bash tool with `run_in_background: true` for each command
2. Launch all subagents simultaneously
3. Do NOT poll for progress - wait for completion notifications
4. Review code only after all subagents complete

**Exact Working Commands by Task Type:**

```bash
# For TypeScript/Complex Logic (High Reasoning) - TESTED AND WORKS
codex exec -c model_reasoning_effort="high" --full-auto "$PROMPT_TS"

# For Standard Tasks (Medium Reasoning) - TESTED AND WORKS
codex exec -c model_reasoning_effort="medium" --full-auto "$PROMPT_STANDARD"

# For Simple Tasks (Low Reasoning) - TESTED AND WORKS
codex exec -c model_reasoning_effort="low" --full-auto "$PROMPT_SIMPLE"
```

**Common Task Templates:**

```bash
# Fix all linter errors (run these in parallel)
codex exec -c model_reasoning_effort="high" --full-auto "Fix all TypeScript errors in this codebase"
codex exec -c model_reasoning_effort="medium" --full-auto "Fix all ESLint errors and warnings"
codex exec -c model_reasoning_effort="low" --full-auto "Format code and organize imports"

# Implement new feature (run these in parallel)
codex exec -c model_reasoning_effort="high" --full-auto "Build React component with full accessibility"
codex exec -c model_reasoning_effort="medium" --full-auto "Create API endpoints with validation"
codex exec -c model_reasoning_effort="medium" --full-auto "Write comprehensive tests"
```

**Execution Pattern:**

1. Launch all subagents with commands above
2. Wait for shell completion notifications (automatic)
3. Use BashOutput tool ONCE per instance to collect results
4. Review and coordinate changes
5. Run validation ONCE at the end

### Step 5: Review and Coordinate Results

1. **Wait for Completion**: Let all shells complete (you'll see notifications)
2. **Collect Outputs**: Use BashOutput ONCE per subagent
3. **Review Changes**: Check what each subagent modified
4. **Resolve Conflicts**: If multiple agents touched same files
5. **Run Validation**: Execute tests/lints ONCE at the end

**Validation Commands (run AFTER all subagents complete):**

```bash
# Detect package manager
if command -v pnpm >/dev/null 2>&1; then
    PM=pnpm
elif command -v yarn >/dev/null 2>&1; then
    PM=yarn
else
    PM=npm
fi

# Run validation suite
$PM run typecheck  # Check TypeScript
$PM run lint       # Check linting (not lint:fix - that modifies files)
$PM run test       # Run tests if they exist
```

### Step 6: Generate Summary Report

```markdown
# Task Completion Report

## Original Task

[USER_TASK]

## Subagents Deployed

1. **[AGENT_1]** (high reasoning): [SUBTASK_1]
   - Status: [COMPLETED/FAILED]
   - Changes: [FILE_COUNT] files modified
2. **[AGENT_2]** (medium reasoning): [SUBTASK_2]
   - Status: [COMPLETED/FAILED]
   - Changes: [FILE_COUNT] files modified

3. **[AGENT_3]** (low reasoning): [SUBTASK_3]
   - Status: [COMPLETED/FAILED]
   - Changes: [FILE_COUNT] files modified

## Validation Results

- TypeScript: [PASS/FAIL]
- ESLint: [PASS/FAIL]
- Tests: [PASS/FAIL/SKIPPED]

## Files Modified

[List of changed files]

## Next Steps

[Any remaining tasks or recommendations]
```

### Step 7: Cleanup and Reset

```bash
# For Claude Code: Use KillBash tool for each background shell
# Do NOT use pkill - it can kill unrelated processes

# Clean up any data in memory
# Reset context for next run
```

## Subagent Strategies by Task Type

### Linting/Formatting Tasks

- **High**: TypeScript errors, complex type issues
- **Medium**: ESLint errors, code quality
- **Low**: Formatting, import organization

### Feature Implementation

- **High**: Core business logic, complex algorithms
- **Medium**: UI components, API endpoints
- **Low**: Simple utilities, config files

### Refactoring Tasks

- **High**: Architecture changes, pattern migrations
- **Medium**: Component extraction, consolidation
- **Low**: Variable renaming, simple moves

### Testing Tasks

- **High**: Integration tests, E2E tests
- **Medium**: Unit tests, component tests
- **Low**: Snapshot updates, simple assertions

### Bug Fixes

- **High**: Complex logic errors, race conditions
- **Medium**: UI bugs, API issues
- **Low**: Typos, simple fixes

## Critical Notes

- **EXACT COMMANDS**: The commands above have been tested and verified to work
- **NO POLLING**: Wait for completion notifications, don't check progress
- **EFFICIENT**: Only read outputs once at the end to save tokens
- **BACKGROUND TERMINALS**: Use `run_in_background: true` for proper execution
- **NO PKILL**: Never use `pkill -f` as it can kill unrelated processes
- **VALIDATION**: Run validation commands AFTER all subagents complete
- **PACKAGE MANAGER**: Detect which one is available (pnpm/yarn/npm)

## Troubleshooting

If commands fail:

1. Verify codex CLI is installed: `codex --version`
2. Check the exact syntax matches what's documented above
3. Ensure you're using `--full-auto` flag to avoid approval prompts
4. Use `run_in_background: true` for proper terminal sessions
5. For validation, use `lint` not `lint:fix` (read-only check)
