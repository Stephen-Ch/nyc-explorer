# Tech Debt and Future Work — NYC Explorer

## Tech Debt (curated)
- Program.cs remains a hot file; keep changes small and consider extracting stable helpers when story-scoped.
- Provider-ready routing relies on fixtures and interception; keep live-provider wiring out of CI until governed.

## Future Work
- Expand Manhattan coverage beyond Union Square + Flatiron once v0.1 is stable.
- Add richer turn-by-turn rendering once adapter contracts and accessibility semantics are locked.
- Add more rigorous content pipeline and rights workflows when moving toward TimeWalk-style historical material.

Last updated: 2026-01-11
