# Portable Vibe-Coding Kit — Lessonwriter

> **File Version:** 2026-02-06 | **Bundle:** v7.2.1

The files in this directory

## Start Here

| New to vibe-coding? | Read this first |
|---------------------|-----------------|
| **User story** | [portability/user-story-stephen-vibe-coding.md](portability/user-story-stephen-vibe-coding.md) — What Stephen wants from this workflow |
| **Quick reference** | [protocol-lite.md](protocol-lite.md) — Core rules in ~150 lines |
| **Prior Research rule** | [protocol-v7.md § Prior Research Lookup](protocol/protocol-v7.md#c-prior-research-lookup-mandatory) — Mandatory before any RESEARCH-ONLY output |

## How to use this kit
1. **Start here:** Run through [session-start-checklist.md](session-start-checklist.md) before any work session.
2. **Quick reference:** Read [protocol-lite.md](protocol-lite.md) for core rules summary (~150 lines).
3. **If resuming:** Check [PAUSE.md](PAUSE.md) for session handoff state.
4. Read [protocol/protocol-v7.md](protocol/protocol-v7.md) for full authoritative rules (gates, sequencing, stop conditions).
5. Follow [protocol/copilot-instructions-v7.md](protocol/copilot-instructions-v7.md) while composing every completion report (coverage proof, proof-of-experience, entry-point maps, etc.).
6. Self-check against [protocol/stay-on-track.md](protocol/stay-on-track.md) whenever working on cross-cutting UX or coverage-sensitive tasks.
7. Reference [protocol/working-agreement-v1.md](protocol/working-agreement-v1.md) for operator vs AI responsibilities and commit standards.

Legacy duplicates under `docs/protocol` now contain redirect banners and exist only for backward compatibility with older prompts. Edit the vibe-coding copies instead.

## Directory map
- `protocol/` — Living workflow docs (protocol-v7, copilot instructions, stay-on-track, working agreement).
- `templates/` — Required completion-report blocks (test-touch, closeout artifact verification, evidence pack, manual test).
- `standards/` — Canonical standards for research docs and stack profiles (portable across repos).
- `portability/` — Subtree integration playbook for adding/updating the bundle in other repos.
- `terminology/` — Project-wide dictionary plus a template for adding new product → storage mappings.
- `session-start-checklist.md` — Single-page pre-flight checklist for session startup.
- `protocol-lite.md` — Quick-reference entrypoint (~150 lines) linking to authoritative sections.
- `PAUSE.md` — Session handoff state for resumption.

## Standards (Portable)

| Standard | Purpose |
|----------|---------|
| [standards/research-standard.md](standards/research-standard.md) | Canonical research doc format + indexing rules |
| [standards/stack-profile-standard.md](standards/stack-profile-standard.md) | How to declare repo technology stack for gates |

**Project-specific:** [../project/stack-profile.md](../project/stack-profile.md) — LessonWriter's stack declaration

## Templates Quick Reference

| Template | Purpose |
|----------|---------|
| [EVIDENCE-PACK-TEMPLATE.md](templates/EVIDENCE-PACK-TEMPLATE.md) | Required when confidence <95% |
| [MANUAL-TEST-TEMPLATE.md](templates/MANUAL-TEST-TEMPLATE.md) | Formal acceptance/regression tests |
| [closeout-artifact-verification-template.md](templates/closeout-artifact-verification-template.md) | S2C merge verification |
| [test-touch-block-template.md](templates/test-touch-block-template.md) | When touching test files |

## Contribution rules
- Keep language portable; replace Rawls-specific jargon with templates or clearly marked examples when possible.
- Note any Rawls-only adjustments (such as specific route coverage lists) inline so other repos can override them.
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
