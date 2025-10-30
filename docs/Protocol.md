# Vibe Coding Protocol — 10-24-25 (v2025.10.24)

**Purpose**
Single source of truth (“Doc 1”) for Read Order, Behavior Contracts, Confirmation Standard, Decisions format, context windowing, failure-recovery, schema/versioning, and metrics. Keep this file at `/docs/Protocol_10-24-25.md`.

---

## Read Order (always)
1. `Project.md` (vision, constraints, definition of done)
2. `Code-Review-Guide_10-24-25.md` (review lens; DoD rules)
3. `Copilot-Instructions_10-24-25.md` (prompt scaffolding mini-guide)
4. `Session-Start_10-24-25.md` (daily ritual)
5. Current **Sprint** file (goal, story list, AC)
6. `code-review.md` (**latest three Decisions** lines; see below)

**Linked references**
- Regressions Playbook → `/docs/Playbook_10-24-25.md`
- Schema & Migration → `/docs/content-schema.md` (v1 frozen; v2 plan)
- Selectors Registry → `/docs/gen-UI-Selectors_*`
- Prompt Changelog → `/docs/prompts/CHANGELOG.md`
- Metrics → `/docs/metrics/prompt-effectiveness.csv`

---

## What You Must Produce in Every Step
- **Behavior Contract** (3–6 Given/When/Then lines; include one **edge** and one **error** case)
- **Tests** and run → **GREEN** before continuing
- **Decisions**: append **one line** to `code-review.md` (format below)
- **Gate Response**: reply with **PROCEED / REVISE / BLOCK** (see Confirmation Standard)

> **No continuation** until tests are GREEN, the Decisions line is appended, and the response is **PROCEED**.

---

## Confirmation Standard
- **PROCEED:** [**tests GREEN**] • [**Decisions line appended**] • [**All AC met**] • [**evidence/screenshots/paths** if applicable]
- **REVISE:** List **specific issues** preventing proceed. Tag each with the violated **AC** or **rule** (e.g., `AC-3`, `Protocol:Decisions`).
- **BLOCK:** Note the **external dependency or risk** and propose the **unblock step** (owner + next action).

---

## Decisions Line — Format (append to `code-review.md`)
```
[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words on what changed> (#tests=<N>, green=<true|false>)
```
**Example:**
```
[2025-10-24 09:12] lessonwriter/feat/auth AUTH-12 — add login helper + tests (#tests=4, green=true)
```

---

## Prompt Sections (strict order)
1) **Read List** (paths only; link, don’t inline history)
2) **Story ID + Sprint Goal** (copy exact text)
3) **Expected Behavior** (Given/When/Then — include edge + error)
4) **Constraints** (≤2 files touched, ≤60 LOC unless refactor story; tests-first; no unrelated edits)
5) **Artifacts Requested** (screens/movies, final URLs, output paths)
6) **After-Green Actions** (append Decisions; echo the exact line)
7) **Confirmation Standard** (return **PROCEED / REVISE / BLOCK**)

---

## Behavior Contract (pattern + examples)
Provide **3–6** lines per step using **Given/When/Then** covering:
- **Happy path**
- **Edge case** (boundary input or state)
- **Error condition** (bad data or missing dependency)

**Example (Login helper):**
- Given a valid teacher account exists
- When the login form is submitted with correct credentials
- Then the dashboard route loads and shows the teacher name

- Given the password field is empty
- When submit is clicked
- Then an inline validation message appears and no navigation occurs

- Given the auth API returns 500
- When submit is clicked
- Then a toast “Temporary sign-in issue, try again” is shown and the form stays enabled

> If a step touches routing, selectors, or schema, include at least one **edge** line (e.g., slow navigation, missing element, optional field omitted).

---

## Context Windowing (complex projects)
- Always include the **last 3 Decisions** from `code-review.md`.
- Include the **current Sprint Goal** and the **story’s AC** only.
- Link older materials by **path**. Do **not inline** large histories unless this step edits those docs.

---

## Failure Recovery
- On first **red** test: **stop** and reply **REVISE** with the failing spec **title** and **error**.
- If selectors or routes are unknown/changed: run **Probe‑First** spec to capture **screenshots** and **final URL flags**, then retry main spec.
- If **schema mismatch**: run `schema:validate`, link the failing **field path**, and propose a one‑step **patch** or a short **migration stub** (new story if non‑trivial).

---

## Schema Management
### Versioning
- Current schema: **v1.0.0** (frozen)
- Next planned: **v2.0.0** (nested TLQs)
- Changelog: `/docs/schema-changelog.md`

### Automated validation (example with Zod)
```ts
// tests/schema/contentSchema.spec.ts
import { z } from "zod";

const FollowUp = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  reverse: z.boolean()
});

const CategoryV1 = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  followUps: z.array(FollowUp)
});

const ContentV1 = z.object({
  likert5: z.array(z.string()).length(5),
  categories: z.array(CategoryV1)
});

test("content.json matches schema v1.0.0", () => {
  const data = require("../../content/content.json");
  const r = ContentV1.safeParse(data);
  expect(r.success).toBe(true);
});
```

> Wire this into CI so schema drift fails fast.

---

## Prompt Versioning
- Stamp every shared prompt/template with a version header.
- Maintain `/docs/prompts/CHANGELOG.md`.

**Template Header Example**
```
# Copilot Prompt Template — v2025.10.24
- Added Confirmation Standard
- Added edge/error Behavior lines
- Normalized Prompt Sections
```

---

## Metrics Collection (minimal, actionable)
Create `/docs/metrics/prompt-effectiveness.csv` and append **one row per step**:
```csv
date,repo,story_id,prompt_version,green_first_try,revisions,cycle_minutes,notes
2025-10-24,lessonwriter,AUTH-12,v2025.10.24,true,0,18,"Probe-First not needed"
2025-10-24,rawls-game,ROUTE-7,v2025.10.24,false,1,42,"Selector changed; Probe-First fixed"
```

---

## Quick Checklist (per step)
- [ ] Behavior Contract includes **edge** + **error** lines
- [ ] Tests written and **GREEN**
- [ ] Decisions line appended (exact format)
- [ ] Response returns **PROCEED / REVISE / BLOCK**
- [ ] Links to artifacts (screens/paths) included

---

## Appendix — Suggested NPM Scripts (optional)
```json
{
  "scripts": {
    "test": "vitest run",
    "schema:validate": "vitest run tests/schema/contentSchema.spec.ts",
    "e2e": "playwright test",
    "e2e:probe": "playwright test tests/probe"
  }
}
```

**End of Protocol**
