# Changelog

## v0.6.0-rc — 2025-11-10
- Completed home shell extraction: inline nav bootstrap moved to `/js/nav-bootstrap.js`, with `Program.cs` hydrating error JSON and `window.ENV` to support modular script loading.
- Restored geo typeahead stability and provider wiring after extraction, keeping selector contracts intact and clearing targeted Playwright regressions.
- Expanded governance automation with commit-scope, decisions-template, log-integrity, and quarantine TTL meta guards alongside strict selector enforcement in CI.
- Updated project history, code review log, and sprint documentation to align with Commit-on-Green ritual and nav bootstrap refactor outcomes.

## v0.5.0-rc — 2025-11-03
- Expanded routing coverage to include adapter-driven paths, clipboard sharing, and deep-link recovery across browser history.
- Hardened geocoder and route adapters with deterministic mocks, debounce guards, and current-location affordances wired through selectors.
- Polished accessibility with aria-live announcements for copy/share feedback and consistent selector bindings for typeahead status messaging.
- Updated documentation, env templates, and onboarding to reflect mock-first setup, share control behavior, and selector contracts.

## v0.4.0-rc — 2025-11-01
- Locked a repeatable dev loop: hot-reload probe, Razor baseline restore, artifact ignores, and UTF-8 placeholder guard rails keep watch mode green.
- Shipped routing UX upgrades: route segment helper, deep link hydration, reset handling, history push/pop sync, and SVG path overlay tied to active markers.
- Raised accessibility baseline: aria-live route messaging, keyboard/focus parity for overlay markers, labeled Search/From/To inputs, and UTF-8 ellipsis placeholders.
- Expanded content & process hygiene: ≥10 POIs, shared project history micro-log, and release-ready documentation for Sprint 04 workflows.
