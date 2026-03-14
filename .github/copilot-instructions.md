# Copilot Instructions — NYC Explorer (Enforcer)

## Session Start (MANDATORY FIRST COMMAND)

Run: `docs/vibe-coding/tools/run-vibe.ps1 -Tool session-start`
Chains: kit update → forGPT sync → doc-audit -StartSession → prints the session audit block.
If run-vibe.ps1 is unavailable, run: `docs/vibe-coding/tools/session-start.ps1`
Do not proceed until this is run successfully.

## Before any work
1) Read `docs/Start-Here-For-AI.md`
2) Follow `docs/vibe-coding/protocol/PROTOCOL-INDEX.md` and `docs/vibe-coding/protocol/copilot-instructions-v7.md`

Non-negotiables (every response):
1) Proof-of-Read (file + quote + “Applying: rule”)
2) Prompt Review Gate (4 lines) before any commands/edits/searches
3) Stop on error (non-zero exit → stop, propose smallest fix, wait)
4) Default Green Gate for code prompts:
   - `npm run e2e:auto`
   - `npm run typecheck`

Notes:
- If a required artifact is missing (Control Deck or required reading docs), stop and fix docs before code work.
- If a prompt is conversational, do not run commands or edits.
