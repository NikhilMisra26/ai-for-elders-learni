---
name: codex-plan
description: Run three parallel codex instances with different reasoning levels to generate comprehensive implementation plans
---

# codex-plan

This command launches three parallel codex CLI instances with high, medium, and low reasoning levels to generate implementation plans. It then synthesizes the outputs into a master plan, incorporating the best insights from each level.

## Usage

```
/codex-plan <task description>
```

Example: `/codex-plan design a secure authentication system with OAuth2`

## Implementation

When invoked with a task description, execute the following:

### Step 1: Prepare Enhanced Prompts

Create three variants of the prompt for different reasoning levels:

**High Reasoning Prompt:**

```
You are a senior architect creating a comprehensive implementation plan. Task: [USER_TASK]

Requirements:
1. Research current best practices using web search and available tools
2. Consider security, scalability, and maintainability
3. Break down the implementation into detailed, actionable steps
4. Include specific technologies, libraries, and patterns
5. Identify potential challenges and mitigation strategies
6. Provide time estimates for each major component
7. Include testing and validation strategies

Output a structured plan with:
- Executive summary
- Technical requirements
- Step-by-step implementation phases
- Risk assessment
- Success metrics
```

**Medium Reasoning Prompt:**

```
Create a practical implementation plan for: [USER_TASK]

Focus on:
1. Core functionality and essential features
2. Standard implementation patterns
3. Common libraries and tools
4. Basic testing approach
5. Deployment considerations

Provide a clear, actionable plan with reasonable complexity.
```

**Low Reasoning Prompt:**

```
Create a simple, straightforward plan for: [USER_TASK]

Keep it minimal and focused on:
1. Essential steps only
2. Simplest working solution
3. Quick wins and MVP approach
4. Basic validation

Output a concise plan that gets the job done efficiently.
```

### Step 2: Launch Parallel Codex Instances

**IMPORTANT**: Use these EXACT commands that have been tested and verified to work:

For Claude Code execution:

1. Use the Bash tool with `run_in_background: true` for each command
2. Do NOT check progress - wait for completion notifications
3. Collect outputs only after all instances complete

**Exact Working Commands:**

```bash
# Terminal 1 - High reasoning (TESTED AND WORKS)
codex exec -c model_reasoning_effort="high" --full-auto "[HIGH_PROMPT]"

# Terminal 2 - Medium reasoning (TESTED AND WORKS)
codex exec -c model_reasoning_effort="medium" --full-auto "[MEDIUM_PROMPT]"

# Terminal 3 - Low reasoning (TESTED AND WORKS)
codex exec -c model_reasoning_effort="low" --full-auto "[LOW_PROMPT]"
```

**Execution Pattern:**

1. Launch all three commands above using `run_in_background: true`
2. IMMEDIATELY create your own independent analysis (don't wait or check outputs)
3. Wait for shell completion notifications (automatic)
4. Use BashOutput tool ONCE per instance to collect final results
5. Synthesize all four analyses

### Step 3: Create Your Own Independent Analysis

**IMPORTANT**: Do this WHILE codex instances are running, not after!

1. Analyze the task independently
2. Create your own implementation plan
3. Do NOT look at codex outputs during this phase
4. Focus on your unique perspective and insights

### Step 4: Collect Outputs (Only After Completion)

1. Wait for all shell completion notifications
2. Use BashOutput tool to collect final results from each instance
3. Do NOT poll or check progress - only collect once at the end

### Step 5: Analyze and Synthesize All Four Plans

1. Parse and structure all outputs (3 codex + 1 your own)
2. Identify common elements across all plans
3. Extract unique valuable insights from each level:
   - High: Comprehensive architecture and edge cases
   - Medium: Practical implementation details
   - Low: Simplifications that don't compromise functionality
   - Your own: Claude Code specific insights and integration

### Step 6: Create Master Plan

Generate a synthesized plan that:

1. **Incorporates Simplicity**: If low reasoning found a simpler approach that works, prefer it
2. **Adds Robustness**: Include important considerations from high reasoning
3. **Balances Practicality**: Use medium reasoning as the baseline
4. **Highlights Variations**: Note where approaches differ significantly

### Step 7: Present Consolidated Plan

Format the output as:

```markdown
# Master Implementation Plan: [USER_TASK]

## Synthesis Summary

- Combined insights from 3 reasoning levels
- Key simplifications identified
- Critical considerations included

## Recommended Approach

### Phase 1: Foundation

[Synthesized steps combining best of all approaches]

### Phase 2: Core Implementation

[Balanced complexity with practical focus]

### Phase 3: Enhancement & Validation

[Testing, security, and optimization considerations]

## Alternative Approaches

- **Minimal (from low reasoning)**: [When speed matters most]
- **Comprehensive (from high reasoning)**: [When robustness is critical]

## Key Decisions

[Important choices where approaches differed]

## Risk Mitigation

[Combined risk assessments from all levels]

## Time Estimates

- Fast track (minimal): X days
- Balanced approach: Y days
- Comprehensive: Z days
```

### Step 8: Cleanup

```bash
# For Claude Code: Use KillBash tool for each background shell
# Do NOT use pkill - it can kill unrelated processes

# Clean up any temporary data in memory
# Reset context for next run
```

## Critical Notes

- **EXACT COMMANDS**: The commands above have been tested and verified to work
- **PARALLEL EXECUTION**: Create your own analysis WHILE codex runs, not after
- **NO POLLING**: Wait for completion notifications, don't check progress
- **EFFICIENT**: Only read outputs once at the end to save tokens
- **BACKGROUND TERMINALS**: Use `run_in_background: true` for proper execution
- **NO PKILL**: Never use `pkill -f` as it can kill unrelated processes

## Troubleshooting

If commands fail:

1. Verify codex CLI is installed: `codex --version`
2. Check the exact syntax matches what's documented above
3. Ensure you're using `--full-auto` flag to avoid approval prompts
4. Use `run_in_background: true` for proper terminal sessions
