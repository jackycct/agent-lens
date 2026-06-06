# Contributing

Thank you for contributing to this project.

This repository is designed to be friendly to both humans and coding agents. Prefer the documented commands below instead of ad hoc setup steps.

For task-focused contributor guidance, see the contribution wiki at
`docs/wiki/README.md`.

## Optional contributor tools

These tools are optional, but recommended if you work with GitHub issues, pull requests, or Jira tickets from the command line.

| Tool                 | Command | Purpose                                                                   | Required |
| -------------------- | ------- | ------------------------------------------------------------------------- | -------- |
| GitHub CLI           | `gh`    | Work with GitHub issues, pull requests, authentication, and repo metadata | Optional |
| Atlassian CLI        | `acli`  | Work with Jira and Atlassian Cloud from the command line                  | Optional |
| Codex CLI            | `codex` | OpenAI coding agent                                                       | Optional |
| Antigravity CLI      | `agy`   | Google terminal coding agent                                              | Optional |

## Agent-executable setup

Agents and contributors should use the bootstrap script instead of manually downloading installers.

### Windows

Run from the repository root:

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/bootstrap-tools.ps1
```

The script should be:

* Idempotent.
* Safe to run multiple times.
* Non-interactive where possible.
* Smart enough to install or upgrade to the latest supported version.
* Clear when authentication is still required.

After setup, verify:

```powershell
gh --version
acli --version
```

## GitHub CLI

GitHub CLI can be installed on Windows through Windows Package Manager:

```powershell
winget install --id GitHub.cli --source winget --accept-source-agreements --accept-package-agreements
```

To upgrade later:

```powershell
winget upgrade --id GitHub.cli --source winget --accept-source-agreements --accept-package-agreements
```

Authenticate manually when needed:

```powershell
gh auth login
```

Agents should not attempt browser-based authentication unless explicitly instructed by a human.

## Atlassian CLI

Atlassian CLI can be installed by downloading the latest Windows binary.

For x86-64 Windows:

```powershell
Invoke-WebRequest `
  -Uri "https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe" `
  -OutFile "$env:LOCALAPPDATA\Programs\acli\acli.exe"
```

For ARM64 Windows:

```powershell
Invoke-WebRequest `
  -Uri "https://acli.atlassian.com/windows/latest/acli_windows_arm64/acli.exe" `
  -OutFile "$env:LOCALAPPDATA\Programs\acli\acli.exe"
```

The bootstrap script should detect the CPU architecture automatically.

After installation, authenticate manually using the command required by your Atlassian organization.

Agents should not store API tokens, passwords, or credentials in the repository.

## Optional: Google Antigravity CLI (`agy`)

Google Antigravity CLI is an optional terminal-based coding agent. It can inspect the project, propose edits, and run commands with user approval.

### Check installation

```bash
agy --version
```

### Install

Run the standard development tools installer target:

```bash
make dev-tools
```

Or install manually:

macOS / Linux:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

Windows CMD:

```cmd
curl -fsSL https://antigravity.google/cli/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### First run

```bash
agy
```

Start AGY from the repository root:

```bash
cd <repo>
agy
```

Before approving file edits or command execution, review proposed actions carefully.

Do not approve commands that expose secrets, upload files, modify credentials, delete unrelated files, bypass project security controls, or perform unreviewed network operations.

## Rules for agents

When setting up optional tools:

1. Prefer `make dev-tools`.
2. Do not click GUI download buttons.
3. Do not commit downloaded binaries.
4. Do not commit credentials, tokens, or generated auth files.
5. If authentication is required, stop and tell the user which command they need to run.
6. If installation fails, report the exact command, exit code, and error output.
7. Verify installation with:

```powershell
gh --version
acli --version
agy --version
```

## Validation before submitting changes

Before opening a pull request, run the project validation commands:

```powershell
make verify
```

If `make` is unavailable on Windows, use the equivalent project commands documented in `README.md`.

## Agent Execution Contract

This project exposes a stable command interface through `make`.

Required local prerequisites:

- `choco`
- `make`
- `npm`

Recommended setup flow:

```sh
make doctor
make install
make verify
```

Skill packaging validation is included in `make verify` and can also be run
directly:

```powershell
make skill-verify
```

Cleanup:

```sh
make clean
```

The cleanup step removes:

```text
runs/
dist/
```

Agents should prefer `make` targets over manually invoking lower-level commands.
