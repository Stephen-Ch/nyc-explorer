# NYC TimeWalk — Imagery Rights & Labeling Policy
**Date:** 2025-10-29 • **Status:** Planning (pre‑code)

## Principles
- **Truth first:** users must know what they are seeing and how it was made.  
- **Respect rights:** embed only Public Domain / CC0 / permitted CC; otherwise link‑out with thumbnails where allowed.  
- **Provenance:** every asset includes source, rights, and confidence; every claim footnoted.  

## Labels (must display in‑app)
- **Original Photo** — contemporary to subject_year; source shown.  
- **Illustration** — period illustration; source shown.  
- **AI Reconstruction** — generated from sources to depict subject_year; confidence displayed.  
- **Composite** — mixed sources/techniques; note components.  
- **Now (Capture)** — present-day photo/scan (vantage stated).

## Rights Categories
- **PD** — embeddable; cite source.  
- **CC0 / CC‑BY‑x** — embeddable per license; include attribution text.  
- **Link‑only** — do not rehost; show thumbnail if permitted; always link to original.  
- **Unknown/Contested** — do not publish until resolved.

## Required Metadata
- `rights`, `source`, `archive_repo/call_number_or_url`, `subject_year`, `technique`, `confidence`, `claim_scope` links.

## Privacy & Sensitivity
- Blur faces/license plates in **Now** captures.  
- Avoid sensitive interiors without permission when still private property.  
- Use neutral language for tragedy/crime; consider opt‑out flags for real‑time AR overlays at such sites.

## AI Generation Rules
- Train/reference only **PD/Open** inputs; keep a record of all references used.  
- No mimicry of living artists’ protected styles.  
- Keep a **Model Card** note for each tool/version used; log prompts/settings for audit.  
- Mark unresolved inferences and lower confidence accordingly.

## Review Workflow
1. Researcher attaches sources + rights to the asset.  
2. Fact‑checker verifies provenance and claim‑to‑source mapping.  
3. Editor-in-Chief approves labels, confidence, and publish state.  
4. Post‑publish corrections remain visible via audit history.

## Takedown Policy
- Accept requests for corrections or removal where rights or sensitivity concerns arise.  
- Record request, resolution, and asset version changes in audit log.
