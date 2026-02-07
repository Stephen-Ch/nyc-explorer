# Working Agreement v1 — NYC Explorer

## 4-Party Workflow

This project uses a 4-party collaboration model:

| Party | Role | Responsibility |
|-------|------|----------------|
| **Stephen** | Owner/Decider | Names goals/constraints; approves outputs; final decision authority |
| **ChatGPT** | Planner/Prompt Writer | Produces GitHub agent prompts; converts return packets into tiny-step prompts; updates NEXT.md |
| **GitHub.com Agent** | Researcher | Executes return-packet prompts; creates docs/status/ research artifacts; no runtime code changes |
| **Copilot VS Code** | Executor | Runs tiny-step prompts; applies Prompt Review Gate + Green Gate; commits code |

See [return-packet-gate.md](return-packet-gate.md) for the handoff sequence diagram.

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

## Communication Protocol
- AI asks clarifying questions BEFORE starting work
- If confidence < HIGH, AI must STOP and explain why

## Commit Standards
- Format: `<type>: <short description> (tests green)`
- Types: feat, fix, refactor, docs, chore, test
