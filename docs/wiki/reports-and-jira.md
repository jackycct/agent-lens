# Reports And Jira

AgentLens reports are designed for pull requests, Jira tickets, engineering
reviews, and experiment logs.

## Generate A Report

```powershell
agent-bench report --summary runs/2026-06-06/<run_id>/summary.json
```

Include the generated Markdown in the relevant review artifact.

## Jira Ticket Pattern

Use this structure for Jira tickets:

- Summary
- Background
- Problem
- Scope
- Out of scope
- Acceptance criteria
- Implementation notes
- Suggested subtasks
- Dependencies
- Risks

A draft for the contribution wiki and skill packaging uplift is stored at:

```text
docs/jira/uplift-contribution-wiki-skill-packaging.md
```

## CLI Guidance

Use `acli` only after the user has configured Atlassian authentication outside
the repository. Agents must not store Jira credentials, API tokens, or auth
files in this repo.
