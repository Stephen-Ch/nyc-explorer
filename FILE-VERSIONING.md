# File Versioning System — Vibe-Coding Protocol

> **File Version:** 2026-01-18 | **Bundle:** v7.1.3

---

## Purpose

The vibe-coding protocol files are shared across multiple projects. This versioning system ensures:
1. Easy identification of when files were last modified
2. Detection of stale copies (especially in `docs-engineering/forGPT/`)
3. Cross-project synchronization awareness

---

## Version Header Format

Every shared protocol file includes a visible version block at the top (after the title):

```markdown
> **File Version:** YYYY-MM-DD | **Bundle:** v7.x.x
```

**Fields:**
- **File Version:** Date of last meaningful change to THIS file (YYYY-MM-DD format)
- **Bundle:** Current vibe-coding kit version from `VIBE-CODING.VERSION.md`

---

## Files That Require Version Headers

These shared/portable files must have version headers:

| File | Location |
|------|----------|
| `Start-Here-For-AI.md` | `docs/` |
| `README.md` | `docs-engineering/vibe-coding/` |
| `FILE-VERSIONING.md` | `docs-engineering/vibe-coding/` |
| `protocol-v7.md` | `docs-engineering/vibe-coding/protocol/` |
| `copilot-instructions-v7.md` | `docs-engineering/vibe-coding/protocol/` |
| `working-agreement-v1.md` | `docs-engineering/vibe-coding/protocol/` |
| `return-packet-gate.md` | `docs-engineering/vibe-coding/protocol/` |
| `stay-on-track.md` | `docs-engineering/vibe-coding/protocol/` |
| `required-artifacts.md` | `docs-engineering/vibe-coding/protocol/` |
| `alignment-mode.md` | `docs-engineering/vibe-coding/protocol/` |

**Note:** Project-specific files (VISION.md, EPICS.md, NEXT.md) use their own "Last Updated" field and are NOT part of this system.

---

## Update Rules (MANDATORY)

When modifying any versioned file, you MUST:

### 1. Update the File Version Date
Change the date in the version header to today's date:
```markdown
> **File Version:** 2026-01-18 | **Bundle:** v7.1.3
```

### 2. Update forGPT Copy (if exists)
If the file has a copy in `docs-engineering/forGPT/`, update that copy:
```powershell
Copy-Item "docs-engineering/vibe-coding/protocol/protocol-v7.md" -Destination "docs-engineering/forGPT/"
```

### 3. Update VERSION-MANIFEST.md
Update the manifest table in `docs-engineering/forGPT/VERSION-MANIFEST.md`:
- Change the file's version date in the table
- Update the `Generated:` date at the top

### 4. Update VIBE-CODING.VERSION.md (for significant changes)
If the change affects workflow rules or gates, bump the bundle version and update:
- `docs-engineering/vibe-coding/VIBE-CODING.VERSION.md`
- All version headers that reference the bundle version

---

## Version Manifest (Cross-Agent Sync)

The file `docs-engineering/forGPT/VERSION-MANIFEST.md` is the single source of truth for cross-agent version confirmation.

**Why a manifest?**
- ChatGPT and Copilot don't communicate directly — Stephen mediates
- The manifest lets ChatGPT report its versions without parsing every file
- Copilot can quickly compare manifest dates against canonical sources
- Main risk mitigated: forgetting to update GPT after updating protocol files

**ChatGPT prints at session start:**
```
📋 GPT Protocol Versions (from VERSION-MANIFEST.md):
- Manifest Generated: 2026-01-18
- protocol-v7.md: 2026-01-18
- working-agreement-v1.md: 2026-01-18

🤝 HANDSHAKE REQUEST: Please paste this to Copilot and ask:
"Confirm protocol versions match canonical sources"
```

**Copilot responds with handshake result:**
- `✅ VERSION HANDSHAKE: PASS` — ready for work
- `⚠️ VERSION HANDSHAKE: MISMATCH` — lists differences and action items

---

## Session-Start Handshake (MANDATORY)

**No work prompts are executed until the handshake passes.**

1. **GPT reports versions** (first response after file upload)
2. **Stephen pastes to Copilot** with "Confirm protocol versions match"
3. **Copilot checks canonical sources** and responds PASS or MISMATCH
4. **If MISMATCH:** Copilot updates forGPT, Stephen re-uploads, repeat handshake

See `docs-engineering/forGPT/VERSION-MANIFEST.md` for the complete handshake protocol.

---

## Stale Copy Detection

A copy is **stale** if its File Version date is older than the canonical source.

**Detection command:**
```powershell
# Compare forGPT copy date vs canonical
Select-String -Path "docs-engineering/forGPT/protocol-v7.md" -Pattern "File Version:" | Select-Object Line
Select-String -Path "docs-engineering/vibe-coding/protocol/protocol-v7.md" -Pattern "File Version:" | Select-Object Line
```

**If stale:**
1. Copilot reports: "⚠️ forGPT/protocol-v7.md is stale (2026-01-15 vs canonical 2026-01-18)"
2. Copy updated file to forGPT: `Copy-Item "docs-engineering/vibe-coding/protocol/protocol-v7.md" -Destination "docs-engineering/forGPT/"`
3. Notify Stephen to re-upload to ChatGPT session

---

## Cross-Project Sync

When copying the vibe-coding bundle to another project:

1. Copy entire `docs-engineering/vibe-coding/` folder
2. Copy `docs/Start-Here-For-AI.md`
3. Verify all File Version dates match the source project
4. Update any project-specific sections (Green Gate commands, Hot Files list, etc.)

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-18 | Initial versioning system created |
