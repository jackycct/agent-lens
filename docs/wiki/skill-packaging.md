# Skill Packaging

Flight Recorder skills live under:

```text
flight-recorder/skills/<skill-name>/SKILL.md
.apm/skills/<skill-name>/SKILL.md
```

The `.apm/` tree is the APM-first producer package. Generated agent folders are
install output created from `.apm/`; they should not be edited as the source of
truth.

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
name: flight-recorder
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

The verifier checks package skills in both `flight-recorder/skills/`
and `.apm/skills/` for valid frontmatter, required fields, and a directory name
that matches `name`.

Validate the APM package before release:

```bash
apm install
make skill-verify
```

Commit:

- `.apm/instructions/`
- `.apm/skills/`
- `apm.yml`
- `apm.lock.yaml`

Do not commit:

- generated user-level agent folders
- `runs/`
- `dist/`
- `node_modules/`
- local authentication or machine-specific config

Run the full project gate before release:

```powershell
make verify
```

## Release Checklist

- Skill directory name matches frontmatter `name`.
- `description` is concise and action-oriented.
- `apm.yml` declares deterministic targets and explicit `.apm/` includes so
  instructions and skills are discovered consistently from the producer package.
- `apm.yml` declares only real local package dependencies under
  `dependencies.apm`; leave it empty when the repo has no extracted dependency
  packages.
- `apm.lock.yaml` is updated when package contents change.
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
