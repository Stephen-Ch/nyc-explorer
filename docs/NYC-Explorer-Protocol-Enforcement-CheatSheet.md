# NYC Explorer — Protocol Enforcement (Human Checklist, v2025-11-10)

**Goal:** Ensure every slice follows our prompt-only, tiny-step TDD protocol and guardrails.

## 1) Start of Day (Session-Start)
- Open: `docs/Protocol.md`, `docs/Workflow-Tweaks-S6.md`, latest postmortem & recovery plan (2 min skim).
- Confirm Sprint Goal + pick a Story ID.
- If high-risk (overlay, Program.cs, adapters, schema): clone `docs/templates/high-risk-plan.md` → `docs/plans/<story>.md` and fill it.
- Copy last 3 lines from `/docs/code-review.md` and last 2 micro-entries from `/docs/project-history.md`.
- Send kickoff message with: GOAL, 3–6 Given/When/Then (incl. edge+error), constraints (≤2 files/≤60 LOC), artifacts, and header `Prompt 1/3 — elapsed 0m`.

## 2) Before Each Prompt
- Follow the Read Order (Protocol → selectors → Copilot-Instructions → Project → plans/logs).
- Enforce **Prompt Schema v2** headers: READ, GOAL, ACCEPTANCE, CONSTRAINTS, FILES, COMMANDS, LOGGING, COMMIT-ON-GREEN, WHY-NOW, DRIFT-RADAR.
- If any header is missing → **BLOCK** and request clarification (no edits).

## 3) Slice Loop
- **RED:** add failing spec (include edge+error).
- **GREEN:** minimal change to pass.
- **VERIFY:** run required checks (see §5).
- **LOG:** append one Decisions line to `/docs/code-review.md`.
- **PAUSE:** stop until explicit NEXT/PROCEED.

## 4) Fences & Risk Controls
- Allowed edits fence: ≤2 files / ≤60 LOC. If larger, split into smaller slices or a tiny refactor story.
- High-risk slices: link plan path in the prompt; acknowledge overlay freeze status.
- Q‑GATE (Ask‑Before‑Act): only ask if success gain ≥3%, ≤2 minutes, ≤3 questions, one message.
- Prompt/time caps: max 3 prompts / 60 minutes; include `Prompt X/Y — elapsed <m>` in every reply.

## 5) Commit-on-Green (Pre-Commit)
- **Docs-only:** no Playwright run required (note “docs-only”).
- **Runtime code:** run full Playwright suite **and** `npm run typecheck`; never commit on RED.
- Record results (tests + typecheck) **before** committing.

## 6) Pull Request (PR Template)
- Fill PR with: Context (Story ID, Sprint excerpt), **Behavior Contract**, Tests (GREEN + evidence), Risks/Notes.
- Paste the **Decisions line** (format-checked) and tick Reviewer Outcome.
- Attach artifacts when requested.

## 7) Reviewer Checklist (Human/Peer)
- Behavior Contract covers happy + edge + error and matches the diff.
- Tests GREEN in CI; typecheck GREEN.
- Decisions line appended to `/docs/code-review.md` (correct format).
- Constraints honored; no unrelated files.
- High-risk guardrails acknowledged (plan link, baseline evidence, overlay freeze, prompt log).

## 8) Logs & History Proof
- Decisions line format: `[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words> (#tests=<N>, green=<true|false>)`.
- Snapshot block present after the line when required (branch@sha, dirty count, tests, selectors, env).
- Project history micro-entry added for noteworthy changes (title → “In order to…, I …” → considerations → evidence).

## 9) CI / Meta Gates (Owner)
- Keep CI overlay freeze guard active.
- Maintain meta tests for: quarantine TTL (≤5, 48h), decisions↔history integrity, selector helper strict mode.
- Add/update `.github/pull_request_template.md` to capture snapshot, prompt log, plan link, baseline timestamps.

## 10) Weekly Maintenance
- Audit overlay freeze status and document any RFC to lift it.
- Clear or renew quarantines; escalate expired ones with a Blocker Card.
- Skim last 10 Decisions lines for drift; verify matching history entries.

---
**Quick Commands**
- Run app: `cd apps/web-mvc && dotnet run --urls http://localhost:5000`
- E2E loop: `npm run e2e:auto` (or `npm run e2e:ui`)
- Typecheck: `npm run typecheck`