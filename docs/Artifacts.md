# Visual Artifacts — Rules (v0.1)

## Scope
- Applies to UI screenshots, map captures, and similar visual baselines produced during story delivery.
- Non-visual assets (logs, traces) remain in their respective folders (e.g., Playwright reports).

## Naming & Storage
- Folder: `docs/artifacts/<STORY-ID>/`.
- File pattern: `VIS-<n>.png` (increment `n` per story as needed).
- Keep filenames descriptive via accompanying README notes if context is unclear.

## Size Cap & Format
- Use PNG format; keep each file ≤500KB.
- Prefer 1280×800 viewport unless the story specifies otherwise.

## Refresh Policy
- Re-capture only when a story changes the rendered UI for that area.
- If no visual delta, reuse the previous artifact and note “no change” in the PR/commit.

## Retention & Traceability
- Do not delete past artifacts; keep newest on top within the directory.
- Reference the artifact path in the PR description or Decisions log when relevant.
- Avoid storing temporary/experimental captures—commit only curated, reviewed images.

## PR Linking
- In the PR checklist or summary, link to the artifact path (e.g., `docs/artifacts/VIS-1/P14-map.png`).
- Include a short note describing what the reviewer should observe.
