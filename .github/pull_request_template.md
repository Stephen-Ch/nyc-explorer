<!-- PR_SNAPSHOT -->
### Snapshot
- Branch: <!-- fill with branch name -->
- SHA: <!-- fill with short SHA -->
- Dirty: <!-- count staged/unstaged files -->
- Tests: <!-- e.g. 90/1 -->
- Selectors: <!-- e.g. v0.7 -->
- Env: <!-- e.g. [] or [GEO_PROVIDER=mock] -->

<!-- PR_PROMPT_SCHEMA_V2 -->
### Prompt Schema v2
- Prompt ID: <!-- P## from Decisions log -->
- Read Stack: <!-- summarize key docs reviewed -->
- Goal: <!-- concise intent statement -->
- Acceptance: <!-- explicit acceptance criteria -->
- Allowed Edits: <!-- Fence details: files, LOC limits -->

### Summary
- [ ] Story / slice ID:
- [ ] Guardrail plan: link to `docs/plans/...`
- [ ] Overlay freeze status: ☐ not active ☐ approved exception ☐ n/a

### Baseline Verification
- [ ] Full Playwright suite (pre-flight) — command + timestamp:
- [ ] `npm run typecheck` (pre-flight) — command + timestamp:
- [ ] Full Playwright suite (post-change) — command + timestamp:
- [ ] `npm run typecheck` (post-change) — command + timestamp:

### Prompt Log
- [ ] Provide prompt log snippet (`Prompt X/Y — elapsed <m>`) proving cap adherence.

### Tests
- Spec(s) run: <!-- list specs or suites executed -->
- Outcome: <!-- GREEN / RED (expected) / N/A -->

### Additional Checks
- [ ] CI overlay guard passes
- [ ] Recovery plan steps still valid (link if updated)

### Blocker Card (optional)
- Link: <!-- paste URL or leave N/A -->

<!-- PR_CHECKS -->
### Release Checklist
- [ ] Commit-on-Green observed (tests + typecheck where applicable)
- [ ] Quarantine TTL respected (no expired skips)
- [ ] Meta gates documented (if touched)

### Reviewer Notes
- Testing evidence / traces:
- Docs touched:
