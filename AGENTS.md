# Agent Instructions

This file defines repo-specific guidance for coding agents working in this project.

## Project Basics

- Stack: Vue 3 + Vite.
- Package manager: npm (`package-lock.json` is committed).
- Quality gate command:
  - `npm run check` (lint + unit tests + build)

## GitHub Automation Context

- CI workflow: `.github/workflows/ci.yml`
- Security scanning: `.github/workflows/codeql.yml`
- Dependabot auto-merge policy: `.github/workflows/dependabot-automerge.yml`
- Release automation: `.github/workflows/release-please.yml`
- PR labeling: `.github/workflows/labeler.yml` with `.github/labeler.yml`
- Ownership rules: `.github/CODEOWNERS`
- Branch protection baseline: `.github/branch-protection.md`

## Commit and PR Rules

1. Prefer Conventional Commits:
   - `feat:` -> minor release
   - `fix:` -> patch release
   - breaking changes require `!` or `BREAKING CHANGE:`
2. Run `npm run check` before opening or updating a PR when code/config changes.
3. Keep workflow and docs changes synchronized:
   - if `.github/workflows/*` changes, update `README.md` when behavior changes.
4. Do not manually edit release tags; use Release Please flow.

## Safety

- Do not use destructive git commands (`reset --hard`, force pushes) unless explicitly requested.
- If required status check names change, also update `.github/branch-protection.md` and related docs.
