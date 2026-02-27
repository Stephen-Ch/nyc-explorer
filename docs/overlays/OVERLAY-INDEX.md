# Overlay Index

Overlays hold repo-specific truths (branch names, merge ownership, build commands, hot-file lists) so the vibe-coding kit stays generic and portable across repositories.

**Convention:** Overlays live under this repo's docs root: `docs`

## Registered Overlays

| Overlay | File | Purpose |
|---------|------|---------|
| NYC Explorer | [nyc-explorer.md](nyc-explorer.md) | Repo identity, integration branch, build/test commands for Stephen-Ch/nyc-explorer |
| Stack Profile | [stack-profile.md](stack-profile.md) | Technology stack, standard commands, environment constraints |
| Merge Commands | [merge-commands.md](merge-commands.md) | Build Gate and Test Gate commands for merge workflow |
| Hot Files | [hot-files.md](hot-files.md) | High-churn / high-risk files requiring extra caution |
| Repo Policy | [repo-policy.md](repo-policy.md) | Branch policy, PR rules, merge method, naming conventions |
