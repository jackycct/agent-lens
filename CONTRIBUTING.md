# Avionics Flight Recorder Contribution Wiki

This wiki is the contributor entrypoint for Avionics Flight Recorder. It complements
`README.md` with task-focused guidance for humans and coding agents.

## Pages

- [Contributor Setup](docs/wiki/contributor-setup.md)
- [Contribution Workflow](docs/wiki/contribution-workflow.md)
- [Skill Packaging](docs/wiki/skill-packaging.md)
- [Reports, PRs, And Jira](docs/wiki/reports-and-jira.md)
- [Troubleshooting](docs/wiki/troubleshooting.md)

## Command Contract

Run commands from the repository root unless a page says otherwise.

```powershell
make doctor
make install
make verify
```

Agents should prefer these targets over lower-level commands so local
validation remains consistent across contributors.
