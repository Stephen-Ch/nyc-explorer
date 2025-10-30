# Contributing to NYC Explorer

## Commit Message Format

One story = one commit (after GREEN).

**Format:**
```
STORY-ID — short description (#tests=N, green=true|false)
```

**Examples:**
```
ROUTE-1b — implement /poi/{id} route (#tests=7, green=true)
SEARCH-1a — add client-side filter test (#tests=1, green=false)
DATA-5b — add 2 Union Square/Flatiron POIs, now 5 total (#tests=12, green=true)
```

**Guidelines:**
- Commit after GREEN step (before LOG step)
- Keep description to ~12 words focusing on what changed
- Include accurate test count and green status
- Use issue tracker suffix when applicable: `; issue=GH-123`

---

## Workflow

1. **RED** — Write failing test with clear error messages
2. **GREEN** — Minimal implementation to pass tests
3. **VERIFY** — Run full suite (`npm run e2e:auto`) + typecheck (`npm run typecheck`)
4. **COMMIT** — Create git commit with format above
5. **LOG** — Update `/docs/code-review.md` and `/docs/project-history.md`
6. **PAUSE** — Await user cue before next story

---

For full process details, see `/docs/Protocol.md` and `/docs/Copilot-Instructions.md`.
