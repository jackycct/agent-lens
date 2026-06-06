# Contributing

Thank you for contributing to this project.

This repository is designed to be friendly to both humans and coding agents. Prefer the documented commands below instead of ad hoc setup steps.

## Optional contributor tools

These tools are optional, but recommended if you work with GitHub issues, pull requests, or Jira tickets from the command line.

| Tool                 | Purpose                                                                   | Required |
| -------------------- | ------------------------------------------------------------------------- | -------- |
| GitHub CLI `gh`      | Work with GitHub issues, pull requests, authentication, and repo metadata | Optional |
| Atlassian CLI `acli` | Work with Jira and Atlassian Cloud from the command line                  | Optional |

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

## Rules for agents

When setting up optional tools:

1. Prefer `scripts/bootstrap-tools.ps1`.
2. Do not click GUI download buttons.
3. Do not commit downloaded binaries.
4. Do not commit credentials, tokens, or generated auth files.
5. If authentication is required, stop and tell the user which command they need to run.
6. If installation fails, report the exact command, exit code, and error output.
7. Verify installation with:

```powershell
gh --version
acli --version
```

## Validation before submitting changes

Before opening a pull request, run the project validation commands:

```powershell
make test
make lint
```

If `make` is unavailable on Windows, use the equivalent project commands documented in `README.md`.
