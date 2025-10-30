# Routing & Scoring Policy

## Base
- Pedestrian network from NYC LION (or OSM), simplified to walkable edges.
- Fastest path is baseline; generate candidate alternates with small side-street deviations.

## Scoring
- Define a buffer (40–60 m) around a candidate path; collect attractions matching exact Year.
- **AttractionScore = Σ (PowerWeight[power] * InterestWeight[facet])**
  - Defaults: PowerWeight {1:1, 2:2, 3:4}; InterestWeight = 1 for all (MVP).
- **RouteScore = AttractionScore / RouteLength_km**

## Objective
- Maximize `RouteScore - λ * TimeMinutes`, s.t. `TimeMinutes ≤ (1 + detour_budget) * FastestTime`.
- UI exposes **Speed ↔ Stories** slider that tunes λ.
- **Density cap:** publish top 3 per block by Power → proximity → editorial_priority; overflow available on click.

## Year Specificity
- Attractions must be active in the exact Year; lot snapshots use latest interval ≤ Year with confidence shown.
