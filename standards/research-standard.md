# Research Documentation Standard

> **Scope:** Portable across all repos using the vibe-coding bundle.  
> **Authority:** This is the canonical source for research doc structure.

---

## Required Header Block

Every research document (`R-###-<Title>.md`) MUST start with this header:

```markdown
# R-###: <Title>

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **PROMPT-ID** | (if applicable, else "N/A") |
| **Area** | (e.g., Scoring, UI, Database, CI) |
| **Status** | DRAFT / COMPLETE |
| **Confidence** | ##% |
| **Evidence Links** | (file paths, PR numbers, or "see below") |
```

**Field Definitions:**
- **Date:** When research began (ISO format)
- **PROMPT-ID:** The prompt that triggered this research (if any)
- **Area:** Functional area being investigated
- **Status:** DRAFT while gathering evidence; COMPLETE when conclusions are final
- **Confidence:** Percentage confidence in conclusions (see 95% rule)
- **Evidence Links:** Quick pointers to key evidence (detailed evidence in body)

---

## Required Sections

Every research doc MUST include these sections (in order):

### 1. Issue Summary
- **Symptom:** What is observed (exact behavior)
- **Expected:** What should happen instead
- **Impact:** Who/what is affected

### 2. Reproduction Steps
Numbered steps to reproduce the issue. Include:
- Environment details (OS, runtime version, browser)
- Test data identifiers (IDs, names)
- Exact sequence of actions

### 3. Evidence Gathering
How evidence was collected:
- Commands used (with output)
- File paths and line numbers
- Query results (anonymized if needed)

### 4. Competing Hypotheses
At least 2 hypotheses with:

| # | Hypothesis | Evidence For | Evidence Against | Falsification Test |
|---|------------|--------------|------------------|-------------------|
| 1 | ... | ... | ... | ... |
| 2 | ... | ... | ... | ... |

### 5. What Would Change My Mind
List specific observations that would shift your diagnosis:
- "If I observed X, I would conclude Y instead"
- "If query Z returned different results, hypothesis 1 would be falsified"

### 6. Decision / Conclusion
- What the evidence proves
- Recommended action
- Remaining unknowns (if any)

### 7. Confidence Statement
```
Confidence: ##%
Basis: <1-2 sentences explaining why this confidence level>
Ready to proceed: YES / NO
```

---

## No Guessing Rules

**NEVER guess about:**
- Root cause of bugs without reproduction
- File locations or code structure without verification
- Database state without query evidence
- Runtime behavior without instrumentation or logs
- Configuration precedence without documented proof

**If you don't know, SAY SO.** Then gather evidence.

**The 95% Rule:** If confidence is below 95%, you MUST remain in RESEARCH-ONLY mode. No code changes until confidence ≥95%.

---

## Citing Evidence

### File References
Use file path + line number format:
```
Source: Controllers/GradeController.cs:L145-L160
```

### Command Evidence
Include the exact command and output:
```
Command: Select-String -Path "*.cs" -Pattern "CalculateScore"
Output:
  GradeController.cs:145:    var score = CalculateScore(rubric);
  ScoringService.cs:78:      public int CalculateScore(Rubric r)
```

### Database Evidence
Include query + anonymized results:
```sql
SELECT StudentId, Score, CreatedDate 
FROM Submissions 
WHERE LessonId = 123;
-- Result: 15 rows, scores range 0-100, all CreatedDate = 2026-02-05
```

---

## Research Modes

### RESEARCH-ONLY Mode
**Allowed:**
- `read_file`, `grep_search`, `list_dir`
- `git log`, `git diff`, `git status`, `git show`
- Database SELECT queries (read-only)
- Creating markdown docs in `research/`

**Forbidden:**
- Editing runtime code
- Creating branches for code changes
- Running builds/tests that modify state
- Database INSERT/UPDATE/DELETE

### INSTRUMENTATION (CODE-OK) Mode
**When to use:** RESEARCH-ONLY insufficient; need runtime observation.

**Requirements:**
- Explicit mode switch: "Switching from RESEARCH-ONLY → INSTRUMENTATION"
- All instrumentation code labeled: `// INSTRUMENTATION: <ticket> — REMOVE AFTER DIAGNOSIS`
- Max 20 lines per file
- Must NOT be merged to develop/main
- Creates follow-up task to remove instrumentation

---

## Indexing Rule

**Every research document MUST be added to ResearchIndex.md** in the same commit that creates it.

Index entry format:
```markdown
| R-### | YYYY-MM-DD | PROMPT-ID | Area | Summary | Key Files |
```

Research docs not in ResearchIndex are considered orphaned and may be lost.

---

## Document Lifecycle

1. **Create:** Start with DRAFT status, fill header + sections as you gather evidence
2. **Update:** Add evidence, refine hypotheses, update confidence
3. **Complete:** Set status to COMPLETE when conclusions are final
4. **Archive:** Completed research remains in place; do not delete

**Addendum Rule:** If new information surfaces for a COMPLETE doc, create a new doc (`R-###-Addendum-<Original>`) rather than modifying conclusions.

---

## Quick Checklist

Before marking research COMPLETE:
- [ ] Header block filled (all 6 fields)
- [ ] Reproduction steps documented
- [ ] At least 2 competing hypotheses listed
- [ ] "What would change my mind" section populated
- [ ] Confidence ≥95% with basis stated
- [ ] Added to ResearchIndex.md
