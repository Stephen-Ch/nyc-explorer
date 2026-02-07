# Portable Vibe-Coding Kit (NYC Explorer)

The files in this directory are the **source of truth** for this repo’s vibe-coding workflow rules, completion report requirements, and shared terminology. They are written to be portable (copy/paste ready for sister repos) and therefore avoid project-specific references beyond what is needed for examples.

## How to use this kit
1. Read [protocol/protocol-v7.md](protocol/protocol-v7.md) before acting on any prompt. It defines the gates, sequencing, and stop conditions.
2. Follow [protocol/copilot-instructions-v7.md](protocol/copilot-instructions-v7.md) while composing every completion report (coverage proof, proof-of-experience, entry-point maps, etc.).
3. Self-check against [protocol/stay-on-track.md](protocol/stay-on-track.md) whenever working on cross-cutting UX or coverage-sensitive tasks.
4. Reference [protocol/working-agreement-v1.md](protocol/working-agreement-v1.md) for operator vs AI responsibilities and commit standards.

Legacy duplicates under `docs/protocol` now contain redirect banners and exist only for backward compatibility with older prompts. Edit the vibe-coding copies instead.

## Directory map
- `protocol/` — Living workflow docs (protocol-v7, copilot instructions, stay-on-track, working agreement).
- `templates/` — Required completion-report blocks (test-touch, closeout artifact verification) shared across prompts.
- `terminology/` — Project-wide dictionary plus a template for adding new product → storage mappings.

## Contribution rules
- Keep language portable; keep NYC Explorer specifics in clearly marked sections.
- When porting to sister repos, update project context (routes, hot files, gate commands).
- When the kit evolves, update [docs/Start-Here-For-AI.md](../Start-Here-For-AI.md) and [docs/INDEX.md](../INDEX.md) so new sessions land here first.

Questions about historical behavior or superseded docs? Check `docs/archive` for prior reports, templates, and experiments.

## Return Packet Gate (Research Before Risky Work)

When entering Alignment Mode with hot-file or high-uncertainty triggers, run the Return Packet Gate first:

- **Protocol:** [protocol/return-packet-gate.md](protocol/return-packet-gate.md) — Defines triggers, acceptance criteria, and 4-party handoff
- **Template:** [templates/github-agent-return-packets-prompt-template.md](templates/github-agent-return-packets-prompt-template.md) — Ready-to-paste GitHub agent prompts

**Example return packets:**
- [return-packet-2026-01-09-ci-multiplayer-regression-epic-003.md](../status/return-packet-2026-01-09-ci-multiplayer-regression-epic-003.md)
- [return-packet-2026-01-09-signalr-diagnostics-td-diag-001.md](../status/return-packet-2026-01-09-signalr-diagnostics-td-diag-001.md)
- [return-packet-2026-01-09-mongodb-concurrency-td-be-002.md](../status/return-packet-2026-01-09-mongodb-concurrency-td-be-002.md)
