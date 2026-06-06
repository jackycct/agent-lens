# Contributor Setup

## Required Tools

- `choco`
- `make`
- `npm`
- Node.js 20 or newer

Validate the environment:

```powershell
make doctor
```

Install project dependencies:

```powershell
make install
```

Run the full local validation path:

```powershell
make verify
```

## Optional CLI Tools

Optional tools are documented in `CONTRIBUTING.md`:

- `gh` for GitHub issues and pull requests.
- `acli` for Jira and Atlassian Cloud.
- `codex` for OpenAI coding-agent workflows.
- `agy` for Antigravity coding-agent workflows.

Use the repo target where possible:

```powershell
make dev-tools
```

Authentication remains a manual user action. Do not commit credentials, API
tokens, generated auth files, or downloaded binaries.
