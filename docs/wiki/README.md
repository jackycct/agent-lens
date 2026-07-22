# Avionics Flight Recorder Contribution Wiki

This wiki is the contributor entrypoint for Avionics Flight Recorder. It complements
`README.md` and `CONTRIBUTING.md` with task-focused guidance for humans and
coding agents.

## Pages

- [Contributor Setup](contributor-setup.md)
- [Contribution Workflow](contribution-workflow.md)
- [Skill Packaging](skill-packaging.md)
- [Reports, PRs, And Jira](reports-and-jira.md)
- [Troubleshooting](troubleshooting.md)
- [Migration Guide](../migration.md)

## Command Contract

Run commands from the repository root unless a page says otherwise.

```powershell
make doctor
make install
make verify
```

Agents should prefer these targets over lower-level commands so local
validation remains consistent across contributors.
