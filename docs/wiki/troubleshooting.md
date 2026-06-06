# Troubleshooting

## Git Safe Directory

If Git reports dubious ownership on Windows, use a per-command safe-directory
override or ask the repository owner before changing global Git config:

```powershell
git -c safe.directory=C:/w/agent-lens status --short
```

## Missing Make

Install Chocolatey and Make as documented in `README.md`, then rerun:

```powershell
make doctor
```

## Missing Optional CLIs

Optional CLIs are not required for build/test validation. Install them through:

```powershell
make dev-tools
```

Manual authentication may still be required.

## Skill Validation Fails

Check that:

- The skill path is `agentic-system-telemetry/skills/<skill-name>/SKILL.md`.
- `SKILL.md` starts with YAML frontmatter.
- Frontmatter includes `name` and `description`.
- The `name` value matches the skill directory.
