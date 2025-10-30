# Code Review Decisions Log — NYC Explorer

**Purpose**  
Track all development decisions in chronological order using the standardized format from Code-Review-Guide_10-24-25.md.

**Format**  
```
[YYYY-MM-DD HH:MM] <REPO>/<BRANCH> <STORY-ID> — <~12 words on what changed> (#tests=<N>, green=<true|false>)
```

**Guidelines**
- Append exactly one line per completed story/PR
- Include test count and green status for traceability
- Keep description to ~12 words focusing on what changed
- Use issue tracker suffix when applicable: `; issue=GH-123` or `; issue=NA`

---

## Decisions History

[2025-10-30 12:00] nyc-explorer/main SETUP-1 — initialize repository with comprehensive documentation (#tests=0, green=NA)
[2025-10-30 15:30] nyc-explorer/main SETUP-2 — add playwright harness with intentional red smoke test (#tests=1, green=false)
[2025-10-30 16:15] nyc-explorer/main SETUP-2b — add minimal API serving home page, probe test green (#tests=1, green=true)
[2025-10-30 16:45] nyc-explorer/main SCHEMA-5a — add POI schema validation test, red on missing file (#tests=1, green=false)
[2025-10-30 17:00] nyc-explorer/main DATA-4 — create poi.v1.json with 3 Manhattan POIs, schema test green (#tests=1, green=true)
[2025-10-30 17:15] nyc-explorer/main SETUP-3a — add API test for /content/poi.v1.json endpoint, red 404 (#tests=1, green=false)
[2025-10-30 17:30] nyc-explorer/main SETUP-3b — implement /content/poi.v1.json endpoint, API test green (#tests=1, green=true)
[2025-10-30 18:00] nyc-explorer/main MAP-1a — add map + POI list test, red on missing #map (#tests=1, green=false)
[2025-10-30 18:30] nyc-explorer/main MAP-1b — add #map container + POI list rendering, map test green (#tests=4, green=true)
[2025-10-30 19:00] nyc-explorer/main MAP-1c — add Leaflet markers test, red on Leaflet not loaded (#tests=1, green=false)
[2025-10-30 19:30] nyc-explorer/main MAP-1d — add Leaflet library + marker rendering, all tests green (#tests=5, green=true)
[2025-10-30 20:00] nyc-explorer/main TOOL-1a — add e2e:auto script, red on server not reachable (#tests=5, green=false)
[2025-10-30 20:15] nyc-explorer/main TOOL-1b — add Playwright webServer config, auto-start working all green (#tests=5, green=true)
[2025-10-30 20:30] nyc-explorer/main TOOL-2a — add TypeScript + typecheck script, red 109 errors (#tests=0, green=false)
[2025-10-30 20:45] nyc-explorer/main DOC-1 — add project-history micro-log + Copilot binding (#tests=0, green=NA)
[2025-10-30 21:00] nyc-explorer/main DOC-1b — update project-history template and Sprint 02 section (#tests=0, green=NA)

---

**Parked Items**
- (None currently)