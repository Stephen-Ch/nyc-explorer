# NYC TimeWalk — Imagery Pipeline & 3D Standards
**Date:** 2025-10-29 • **Status:** Planning (pre-code)

## Goals
- Deliver **credible, beautiful, and performant** visuals for 2D map pins and 3D AR/VR views.
- Keep the project **academically impeccable**: every depiction is traceable to sources and clearly labeled.
- Support three lanes of content: **Archival**, **On‑site Capture**, **AI Reconstructions**.

## Lanes & When to Use Them
1) **Archival (PD/Open)** — use when a high-quality, rights‑clear image exists for the **depicted year**.  
2) **On‑site Capture (present day)** — use as a “now” layer or as geometry reference for reconstructions.  
3) **AI Reconstruction (photo‑real)** — use when archival is missing/insufficient; depict a **specific year** using sources.

> Every image must declare `technique = archival | capture | ai_reconstruction | illustration` and `subject_year` (depicted year).

## Source Hierarchy (for reconstructions)
1. Lot timeline evidence (atlases, designation reports, tax photos, plans).  
2. Period photos/illustrations with vantage notes.  
3. Contemporary descriptions (newspapers, directories).  
4. Reasoned inference (document in notes; mark confidence).

## AI Reconstruction Pipeline (high level)
1. **Brief** (template in Templates doc): subject_year, vantage, key features, sources, confidence baseline.  
2. **Geometry guide:** derive footprints/heights from MapPLUTO + atlases; rough massing mesh if needed.  
3. **Reference set:** curate PD/Open reference images (aligned by year); annotate lens & vantage if known.  
4. **Generation:** image‑to‑image or text‑guided synthesis constrained by references; avoid stylistic drift.  
5. **Truth pass:** compare against sources; correct hallucinations; log unresolved gaps.  
6. **Labeling:** add badges (`AI Reconstruction`, `Composite`, etc.) + footnotes to claims depicted.  
7. **Export:** master + tiled derivatives + metadata JSON (see schema below).

## 2D Asset Specs
- **Master resolution:** ≥ 3000 px on long edge (preferred 4096).  
- **Formats:** Archival = TIFF preferred (store link if not owning file); Delivery = WEBP/JPEG.  
- **Color:** sRGB; avoid heavy stylization; consistent tone mapping.  
- **Derivatives:** 256/512/1024 tiles for responsive delivery; thumbnail 320×…

## 3D/AR Asset Specs
- **Scene formats:** **glTF 2.0** (preferred) and **USDZ** (for iOS AR Quick Look).  
- **Textures:** PBR (BaseColor, Roughness, Metallic, Normal); ≤ 2K per material for mobile; 4K desktop.  
- **Budgets:** Mobile draw calls ≤ 1.5k; triangles ≤ 1M total per scene; texture memory ≤ 300MB mobile.  
- **Anchoring:** world coordinates from lot polygon centroid + heading; add height offsets for multi‑story vantages.  
- **Lighting:** baked lightmaps where possible; simple real‑time key/fill; HDRI environment optional.

## Photogrammetry / NeRF (optional for 'now' scenes)
- **Capture:** 100–300 photos around subject; overcast preferred; avoid pedestrians/faces.  
- **Output:** mesh simplified to glTF; decimate to fit budgets; generate occlusion masks for AR compositing.  
- **Use:** geometry reference for AI reconstructions, or “then vs now” toggles.

## Metadata Schema (YAML/JSON per asset)
```yaml
id: img_000123
title: "Copa Supper Club, main entrance"
technique: ai_reconstruction   # archival | capture | ai_reconstruction | illustration
subject_year: 1964
capture_year: 2025             # if capture; null for archival/AI if not applicable
vantage:
  lat: 40.7631
  lng: -73.9825
  heading_deg: 145
  fov_deg: 70
lot_bbl: "1-01034-0009"
attraction_id: "att_000234"
sources:
  - id: src_001
    claim_scope: "entrance marquee design"
confidence: 0.82
rights: PD                      # PD | CC0 | CC-BY-4.0 | link_only
labels:
  - "AI Reconstruction"
  - "Depicts 1964"
notes: "Marquee letterforms from tax photo; interior inferred from floorplan + reviews."
```

## File Naming
`{subject_year}_{bbl}_{short-title}_{technique}_v{X}.ext`  
Example: `1964_1-01034-0009_copa-entrance_ai-recon_v1.webp`

## In‑App Presentation
- **Badges:** `Original Photo`, `Illustration`, `AI Reconstruction`, `Composite`, `Now`.  
- **Disclosure:** hover/tap shows sources + confidence + rights.  
- **Then/Now toggle:** split slider where both exist.  
- **Save:** add to reading list; deep link includes asset id.

## QA Checklist (Imagery)
- [ ] Subject year displayed & matches metadata.  
- [ ] BBL & vantage verified against map.  
- [ ] All claims in image tied to cited sources.  
- [ ] Confidence set; gaps noted.  
- [ ] Rights recorded; PD/Open for embeds.  
- [ ] Performance budgets met; mobile test pass.  
- [ ] Label/badges correct.

## Acceptance Criteria (per asset)
- Clear year & vantage; no major anachronisms.  
- Footnotes resolve key depicted claims.  
- Meets perf specs on a mid‑tier mobile device (AR off by default at launch).  
- Passes Editor-in-Chief review.
