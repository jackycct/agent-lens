# Reports, PRs, And Jira

Flight Recorder reports are Markdown review artifacts. Use them to summarize
benchmark evidence without committing generated run output.

## Generate A Report

Run from the package workspace after a benchmark summary exists:

```powershell
cd flight-recorder/packages/flight-recorder
flight-recorder report --summary ../../../runs/2026-06-06/<run_id>/summary.json
```

The report command prints Markdown. Attach that Markdown to the relevant pull
request comment, Jira ticket, or engineering review note.

## Pull Requests

Include the report when a change modifies agent behavior, benchmark prompts,
telemetry parsing, or quality gates. Keep the pull request focused on source,
docs, and tests.

Do not commit:

- `runs/`
- `dist/`
- `node_modules/`
- local logs
- credentials or generated authentication files

## Jira And Engineering Reviews

Paste the generated Markdown into the ticket or review artifact with:

- benchmark scenario and variant
- source commit
- quality gate result
- recommendation
- known limitations

Jira and GitHub authentication are local user actions. Store credentials in the
approved local CLI configuration only, never in this repository.

## Release Evidence

Before linking a report from release notes or a review artifact, run:

```powershell
make verify
```

For skill-only documentation changes, also ensure:

```powershell
make skill-verify
```
