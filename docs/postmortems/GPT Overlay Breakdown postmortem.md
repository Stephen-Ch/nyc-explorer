Overlay Breakdown Post-mortem — 2025-11-09 (filled)
Timeline (condensed)

Sprint-06 closeout tag (dfbf54a): green baseline established.

Overlay externalization on “/”: began during Program.cs refactor; repeated REDs on route-find-real.

Symptoms: provider path len=4 observed; DOM had route-path=1 but route-node=0; binding kept resolving to legacy/diagnostic wrapper.

Script/asset issues: parse warnings, order ambiguity; attempts to force deterministic renderer (__deterministicOverlay) didn’t win consistently.

Collateral failures: intermittent ProviderTimeoutError (unit spec), POI timeout guard flake.

Abort: BREAKDOWN declared; docs written; Pivot A proposed (overlay deferred to Sprint-07).

Impact

Multiple cycles lost on non-essential scope.

Program.cs refactor momentum stalled.

Confidence drop + rising regression risk.

Root causes (fishbone → concrete)

Scope drift: Overlay re-landing crept into a Program.cs refactor sprint.

Process: Stop-on-RED and abort thresholds weren’t enforced early; plans were skipped in favor of “quick fixes.”

Guardrails missing: No renderer fingerprint meta; no script-order guard; no “overlay edits blocked” rule.

Binding nondeterminism: Competing globals (renderRoutePath vs wrapper), late inline fallbacks, and script ordering on “/”.

Diagnostics late: Instrumentation added after many attempts; REPO SNAPSHOT cadence inconsistent.

Env/tooling: Worktree vs main confusion; stale assets/caches; long-running PowerShell steps obscured failures.

Tests: Expectations (exact live-region strings) collided with temporary copy changes; RED quarantines weren’t surfaced early enough.

5 Whys (primary chain)

Why no route nodes? → Deterministic renderer not the active binding at runtime.

Why not bound? → Script order and fallback chain allowed legacy wrapper to win or unset function.

Why order/fallback wrong? → No meta guard; mixed inline/external patterns; assumptions about “/” parity.

Why assumptions persisted? → Patch-then-test loop; plans/diagnostics added too late.

Why looped? → Missing hard caps (prompts/time), and we didn’t freeze overlay when drift appeared.

Corrective actions (Pivot A compatible)

Freeze overlay on “/” until Sprint-07. MVC path remains source of truth.

Meta guards (CI):

Renderer fingerprint: renderRoutePath.toString() contains route-node.

Script-order check: overlay loads after home.js on both routes.

“Overlay-edit freeze” guard: fail PRs that touch / overlay files before Sprint-07.

Refactor discipline:

Commit-on-Green; Stop-on-RED; 3-prompt/60-min caps.

REPO SNAPSHOT at session start + after merges.

One-page plan before any risky slice.

Program.cs hardening (next sprint slices, ≤60 LOC each):

Extract HTML helpers (no selector changes).

Finalize JS extraction already started (geo-status.js, typeahead.js, route-ui.js, route-core.js).

Split applySegment into small helpers; centralize error messages in errors.js.

Single manifest place in Program.cs for script order; delete scratch files; tighten .gitignore.

Verification

Baseline (tag) re-verify green post-reset (full Playwright + typecheck).

After refactor slices: full suite + typecheck green; meta guards passing.

Overlay stays untouched on “/” until Sprint-07 RFC with its own contracts and guards.

Evidence (to attach)

Failing spec lines and DOM counts (route-path, route-node).

Script order arrays; renderer toString() fingerprints.

Worktree snapshot (branch, SHA, versions).