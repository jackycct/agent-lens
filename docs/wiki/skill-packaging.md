# Skill Packaging

AgentLens skills live under:

```text
agentic-system-telemetry/skills/<skill-name>/SKILL.md
```

## Required Files

Each skill package must include:

- `SKILL.md`
- YAML frontmatter with `name` and `description`
- Clear use cases
- Clear non-goals
- Operational steps or protocol
- Output expectations or schemas when relevant
- Attribution guidance for copied or modified third-party logic

## Frontmatter

Use this shape:

```markdown
---
name: agentic-system-telemetry
description: Measure coding-agent runs across Codex, Claude Code, GitHub Copilot, and compatible future agents.
---
```

The `name` must match the skill directory. The `description` should be a
single sentence that helps an agent decide when to load the skill.

## Validation

Run:

```powershell
make skill-verify
```

The verifier checks that each skill has valid frontmatter, required fields,
and a directory name that matches `name`.

Run the full project gate before release:

```powershell
make verify
```

## Release Checklist

- Skill directory name matches frontmatter `name`.
- `description` is concise and action-oriented.
- Examples use repo-supported commands.
- Validation passes on Windows from the repo root.
- `README.md` or package docs link to the skill when user-facing behavior changes.
- `NOTICE` is updated if copied or modified third-party code is introduced.
- Generated artifacts are excluded from the commit.

## Compatibility

Keep skill instructions compatible with Codex and Antigravity agent workflows:

- Prefer repository-relative paths.
- Prefer deterministic commands.
- Avoid hidden network or authentication requirements.
- State when a user must perform authentication manually.
