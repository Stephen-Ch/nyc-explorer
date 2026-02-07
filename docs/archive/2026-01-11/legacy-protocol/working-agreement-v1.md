# Working With Stephen — Lite Guide (v1)

> **What this is:** People & style guide for collaborating with Stephen.  
> **Canonical rules:** For gating, Decisions format, tests, and process, see `docs/protocol/protocol-v7.md`.

---

## How to use this doc
One or two sentences of context, then bullets or a ≤5‑step checklist. Keep replies under 6 sentences. Include this doc in ChatGPT context when you want tone/pacing enforced; usually omit for Copilot unless it needs guardrails about small, testable steps.

---

## Golden rules
**Always do**
- Ask questions when uncertain; request wireframes/comps/analogs to remove ambiguity before building.
- Call out when scope drifts or exceeds requirements; propose a minimal, testable path back.
- Suggest workflow improvements when you see friction.

**Never do**
- Drift from requirements.
- Create new functionality without clarifying first.
- Ignore tests (no green tests → no proceed).

---

## Message & instruction format (enforce this)
**Information:** One–two sentences of context → bullets.  
**Instructions:** One–two sentences of context → **checklist (max 5 steps)**.  
**Length:** Keep responses under 6 sentences. If more detail is essential, attach it as a short appendix or link to repo docs.

---

## Daily rhythm & check‑ins (ET)
- Primary window: **6:30–9:30 a.m.**, 7 days/week.
- Secondary: **mid‑afternoon** check‑in (brief status + next 1–3 actions).
- If no response and it’s non‑urgent: wait for next day; do not spam.

---

## Decision style & requirements
- Default: Stephen **chooses**, but **start with rigorous Q&A** to clarify requirements.
- Actively **request artifacts** (wireframes, comps, analogs, diagrams) to remove ambiguity.
- If still ambiguous: **timebox a spike (45–90 min)** → report findings → **propose a reduced‑scope MVP that captures the clear parts** for approval.

---

## Definition of Done (DoD) & evidence
- **Mandatory every time**
  - **Demo video + GIF** (whenever there is something visible to check).
  - **Green test output** (unit/e2e as applicable).
  - **Updated README** (only if user‑facing behavior or setup changed).
  - **Append one Decisions line** to `/docs/code-review.md` (use the format: `[YYYY-MM-DD] <BRANCH> <ID> — <Summary> (#tests=N, green=Y)`).
- **Optional** when relevant: short troubleshooting notes or perf measurements.

**Decisions line suffix for traceability**  
If there is an issue tracker, add a suffix: `; issue=GH-123` (GitHub) or `; issue=AS-45` (Asana). If none, use `; issue=NA` and open one before merge.

---

## Feedback style (use this format)
- **Tone:** **Blunt and direct.**
- **Structure:** **Prioritized list**, most critical first, each with a brief **rationale** + **fix suggestion**.
- **Severity tags:** **RED / YELLOW / GREEN**.
- Keep it concise; link to details if needed.

---

## Overwhelm → reset protocol
- **Signals to watch for:** “I’m overwhelmed” or “Too much info.”
- **Concurrency:** Max **3 threads** at once.
- **Focus cadence:** **20/0** (20‑minute focus blocks; no automatic break unless requested).
- **Auto‑park low priority:** **Yes** — move to a “Parked” list at the bottom of `/docs/code-review.md` or `/docs/Parked.md` with one‑line context.
- **Reset steps:** **Summarize current status → propose next 1–3 actions → wait for confirmation.**

---

## Channel map
- **Non‑urgent (async):** **Email** (summary first, links to repo paths).
- **Urgent blockers (<4h impact):** **Chat ping**.
- **Artifacts delivery:** **Link to repo paths** (attach GIF/MP4 in repo; share the path in chat/email).
- **Calendar holds for demos:** **Do not auto‑create**; ask first.
- **If unreachable for X hours:** **Wait** (do not proceed with reduced scope unless explicitly approved).

---

## Tools & artifacts (defaults)
- IDEs & AI: **Visual Studio**, **VS Code**, **Copilot Chat**, **ChatGPT**.
- Tests/E2E/CI: **Vitest/Jest** (as repo dictates), **Playwright**, CI via repo standard (e.g., GitHub Actions/Azure).
- Artifacts path: `/docs/artifacts/<story-id>/` for GIF/MP4/screenshots (reference these in PRs and status notes).
- Branching/commits: Use repo default; keep diffs small and story‑scoped.

---

## When to include this doc in context
- **Yes:** onboarding collaborators; reminding AI to keep output brief/structured; anytime pacing or communication drift appears.
- **Maybe:** Copilot steps that keep over‑editing or ignore checklists.
- **No:** standalone code generation where Protocol + story AC are sufficient.

---

*This guide is about how to work **with Stephen**; **`docs/protocol/protocol-v7.md`** is how we **do the work**. When in doubt, follow the Protocol and use this guide to tune tone, pacing, and collaboration.*
