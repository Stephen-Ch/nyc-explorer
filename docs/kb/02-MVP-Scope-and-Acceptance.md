# MVP Scope & Acceptance

## Scope
- **Geography:** Manhattan corridor 14th–42nd Street (initial polygon TBD).
- **Time:** exact **Year** selection (one pilot year published; DB supports ranges).
- **Input:** Origin, Destination, Year, Detour Budget (0–10%).
- **Output:** Fastest route annotated with **Attractions** (max 3/block), overflow via “More available”.

## Behavior
- **Year filter:** show attractions active at exact year, or lot snapshot "as of YEAR".
- **Detour-aware routing:** may choose story-richer path within detour cap; slider for Speed ↔ Stories.
- **Save:** user can save attractions to a reading list (anon key acceptable for MVP).

## Acceptance Criteria
- Route renders in ≤2s on desktop for typical A→B within corridor.
- Detour slider increases **RouteScore** without exceeding time cap.
- At least 120 approved attractions across blocks, each with ≥1 primary source and confidence set.
- Tap any pin: blurb (≤200 chars) + source snippet + “Read more” (3-paragraph essay).

## Risks & Mitigations
- **Sparse years:** fall back to lot timeline snapshot; disclose confidence.
- **Overload:** cap 3/block; provide overflow; editorial priority resolves ties.
- **Licensing:** PD/open preferred; link-out for others; rights metadata required.
