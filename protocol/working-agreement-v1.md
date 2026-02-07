# Working Agreement v1 — Blackjack Sensei

> **File Version:** 2026-01-18 | **Bundle:** v7.1.3

## 4-Party Workflow

This project uses a 4-party collaboration model:

| Party | Role | Responsibility |
|-------|------|----------------|
| **Stephen** | Owner/Decider | Names goals/constraints; approves outputs; final decision authority |
| **ChatGPT** | Planner/Prompt Writer | Produces GitHub agent prompts; converts return packets into tiny-step prompts; updates NEXT.md |
| **GitHub.com Agent** | Researcher | Executes return-packet prompts; creates docs-engineering/status/ research artifacts; no runtime code changes |
| **Copilot VS Code** | Executor | Runs tiny-step prompts; applies Prompt Review Gate + Green Gate; commits code |

See [return-packet-gate.md](return-packet-gate.md) for the handoff sequence diagram.

## Agent Safety Policy (MANDATORY)

**Purpose:** Prevent "agent went rogue" incidents by enforcing clear role boundaries.

### GitHub.com Coding Agents = Code Changes ONLY

- GitHub.com agents (Copilot Workspace, GitHub Actions with agent mode) are for **code-change tasks only**
- Research and reporting uses **chat mode** or **local read-only scans**
- Never request "create a .md file" when you mean "report findings in chat"

### Report-Only Handshake (REQUIRED for read-only tasks)

When requesting a read-only report (research, audit, investigation):

1. **Prompt must include:** `Scope: Read-only investigation; no code edits.`
2. **Agent first line must be:** `ACK: READ-ONLY`
3. **If agent cannot comply** (e.g., prompt requests edits), agent must STOP and clarify

### Anti-Patterns (NEVER DO)

| Bad Pattern | Why It's Wrong | Correct Alternative |
|-------------|----------------|--------------------|
| "Create a docs-engineering/status/report.md" for research | Creates file when only analysis needed | "Report findings in chat" |
| Research prompt without READ-ONLY scope | Agent may infer edits are allowed | Add explicit scope guardrail |
| Code agent for audit/investigation | Wrong tool for job | Use chat mode or Copilot conversational |

### Scope Enforcement

- **READ-ONLY tasks:** grep_search, read_file, list_dir, git log/status/diff — no edits, no commits
- **CODE tasks:** May edit files, run tests, commit — requires full Prompt Review Gate

## Operator Responsibilities
1. Provide prompts as single fenced code blocks ending with `# END PROMPT`
2. Review changes before committing
3. Keep prompts small and focused (one story/task per prompt)

## AI Responsibilities
1. Proof-of-Read
2. Prompt Review Gate
3. Stay in scope
4. Stop on error
5. Green Gate (code prompts)
6. Summarize files touched
7. Maintain single-thread sequencing: one prompt → one report → next prompt (never overlap)

## Timeboxing + Pivot Rule (MANDATORY for environmental issues)

When blocked by environmental issues (network, TLS, proxy, machine-specific):

1. **Timebox:** Max 20 minutes OR 3 meaningful config variations
2. **Document:** Create R-### research artifact + TD-### tech debt item
3. **Park:** Link both in ResearchIndex.md and tech-debt-and-future-work.md
4. **Pivot:** Continue with alternative high-ROI work (docs, CI gates, other stories)

Do NOT persist beyond the timebox. Environmental issues often require changes outside Copilot's scope.

## Communication Protocol
- AI asks clarifying questions BEFORE starting work
- If confidence < HIGH, AI must STOP and explain why

## 95% Confidence Gate (Dual-Agent Requirement)

**Rule:** Both ChatGPT (Planner) and Copilot (Executor) MUST enforce the 95% confidence threshold.

### ChatGPT Responsibility
- MUST NOT produce implementation prompts when confidence <95%
- MUST produce RESEARCH-ONLY prompts when more evidence is needed
- MUST include Confidence Statement in prompt drafts

### Copilot Responsibility  
- MUST NOT execute code changes when confidence <95%
- MUST STOP and request evidence gathering
- MUST output: "Confidence <95% — entering RESEARCH-ONLY mode"

### Handshake Phrases
| Phrase | Meaning |
|--------|---------|
| "Confidence <95% — entering RESEARCH-ONLY mode" | Both agents agree research is needed |
| "RESEARCH-ONLY complete — confidence now ≥95%" | Research produced sufficient evidence |
| "Switching to INSTRUMENTATION (CODE-OK)" | Diagnostic code required for evidence |

See [protocol-v7.md](protocol-v7.md) → "No Guessing / 95% Research Gate" for full rules.

## Commit Standards
- Format: `<type>: <short description> (tests green)`
- Types: feat, fix, refactor, docs, chore, test
