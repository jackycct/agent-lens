# Contribution Workflow

## Standard Flow

1. Sync the repository and inspect current changes.
2. Read `README.md`, `CONTRIBUTING.md`, and the relevant wiki page.
3. Make focused changes.
4. Run validation.
5. Attach evidence to the pull request, Jira ticket, or engineering review.

## Validation

Run:

```powershell
make verify
```

`make verify` checks prerequisites, installs dependencies, builds the package,
runs tests, and validates skill packaging.

For docs-only changes that touch skills, run:

```powershell
make skill-verify
```

## Agent Rules

- Prefer `make` targets over ad hoc commands.
- Do not commit `node_modules`, `dist`, `runs`, logs, credentials, or generated auth files.
- Do not perform browser-based authentication unless a human explicitly asks.
- Keep TokenTelemetry reuse behind `telemetry/tokentelemetry-adapter.ts`.
- Preserve MIT attribution in `NOTICE` if copied or modified code is introduced.
