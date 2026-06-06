# Uplift AgentLens Contribution Wiki And Skill Packaging

## Jira Fields

| Field | Value |
| --- | --- |
| Issue type | Story |
| Priority | Medium |
| Labels | agent-lens, documentation, contributor-experience, skills, packaging |
| Component | AgentLens |

## Summary

Uplift AgentLens contributor documentation into a repo contribution wiki and formalize skill packaging so contributors and agents can install, validate, and publish project skills consistently.

## Background

AgentLens is positioned as a skill-first telemetry and benchmark toolkit. The repo already has contribution guidance in `CONTRIBUTING.md`, stable make targets, and a packaged skill at `agentic-system-telemetry/skills/agentic-system-telemetry/SKILL.md`. The next uplift should turn these into a complete contributor-facing wiki and a repeatable skill packaging workflow.

## Problem

Contributor onboarding and skill distribution are partially documented but not yet packaged as a cohesive path. There is no single contribution wiki structure, no explicit skill package manifest/checklist, and no validation flow that confirms the skill can be consumed by supported agent environments.

## Scope

- Create a contribution wiki structure covering setup, validation, issue/PR workflow, agent rules, release notes, and troubleshooting.
- Align wiki content with `CONTRIBUTING.md`, `README.md`, and `Makefile` targets.
- Define skill packaging requirements for `agentic-system-telemetry/skills/agentic-system-telemetry/SKILL.md`.
- Add a skill packaging checklist covering metadata, install path, examples, versioning, attribution, and validation.
- Add or document a validation command that verifies packaged skill files and project build/test flow.
- Document how Jira tickets, PR comments, and benchmark reports should consume `agent-bench report` output.

## Out Of Scope

- Building a hosted documentation site.
- Publishing to an external package marketplace.
- Adding cloud telemetry ingestion or dashboards.
- Storing Atlassian/GitHub credentials in the repo.

## Acceptance Criteria

- A repo contribution wiki exists as Markdown files under a documented path.
- Wiki includes contributor setup using `make doctor`, `make install`, `make verify`, and optional CLI setup from `CONTRIBUTING.md`.
- Skill packaging docs define required files, frontmatter, examples, validation, release, and attribution requirements.
- `agentic-system-telemetry` skill docs include a packaging/release note or link to the new packaging guide.
- Validation instructions are executable on Windows from the repo root.
- Jira/PR/report workflow explains how generated Markdown reports can be attached to engineering review artifacts.
- No credentials, generated auth files, `node_modules`, `dist`, or benchmark run artifacts are committed.

## Implementation Notes

- Prefer repo-native `make` targets over ad hoc commands.
- Keep skill package guidance compatible with Codex and Antigravity agent workflows.
- Preserve TokenTelemetry reuse guidance and MIT attribution requirements if copied or vendored code is introduced.
- Consider adding a lightweight `make skill-verify` target if docs-only validation is insufficient.

## Suggested Subtasks

1. Add contribution wiki files and index.
2. Add skill packaging guide.
3. Link wiki from `README.md` and `CONTRIBUTING.md`.
4. Add skill validation command or documented checklist.
5. Verify with `make verify`.

## Dependencies

- Existing `CONTRIBUTING.md` optional tooling guidance.
- Existing `Makefile` command contract.
- Existing Agentic-System Telemetry skill package.

## Risks

- Docs may drift from make targets unless validation is automated.
- Skill packaging expectations may diverge between agent runtimes unless compatibility is stated explicitly.
- Live Jira automation remains blocked until Atlassian CLI authentication and project key are configured outside the repo.
