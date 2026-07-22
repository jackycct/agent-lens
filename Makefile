ifeq ($(OS),Windows_NT)
  SHELL := C:/Progra~1/Git/bin/bash.exe
  NPM := npm.cmd
else
  SHELL := /bin/bash
  NPM := npm
endif

.DEFAULT_GOAL := help

.PHONY: help doctor dev-tools install build test skill-verify verify clean reset

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

doctor: ## Check required local prerequisites
	@echo "Checking project prerequisites..."
	@command -v choco >/dev/null 2>&1 || (echo "Missing required tool: choco" && exit 1)
	@echo "choco: found"
	@command -v make >/dev/null 2>&1 || (echo "Missing required tool: make" && exit 1)
	@echo "make: found"
	@command -v npm >/dev/null 2>&1 || (echo "Missing required tool: npm" && exit 1)
	@echo "npm: found"
	@echo "Environment check passed."

dev-tools: ## Check and install optional development tools (gh, acli, codex, agy)
	@echo "Checking optional agent CLIs..."
	@if command -v gh >/dev/null 2>&1; then \
		echo "GitHub CLI detected:"; \
		gh --version | head -n 1 || true; \
	else \
		echo "GitHub CLI not found. Installing GitHub CLI..."; \
		if [ "$(OS)" = "Windows_NT" ]; then \
			winget install --id GitHub.cli --source winget --accept-source-agreements --accept-package-agreements || true; \
		else \
			echo "Install GitHub CLI: https://cli.github.com/"; \
		fi; \
	fi
	@if command -v acli >/dev/null 2>&1; then \
		echo "Atlassian CLI detected:"; \
		acli --version || true; \
	else \
		echo "Atlassian CLI not found. Installing Atlassian CLI..."; \
		if [ "$(OS)" = "Windows_NT" ]; then \
			powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "New-Item -ItemType Directory -Force -Path \"$$env:LOCALAPPDATA\\Programs\\acli\" | Out-Null; if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq 'Arm64') { $$uri='https://acli.atlassian.com/windows/latest/acli_windows_arm64/acli.exe' } else { $$uri='https://acli.atlassian.com/windows/latest/acli_windows_amd64/acli.exe' }; Invoke-WebRequest -Uri $$uri -OutFile \"$$env:LOCALAPPDATA\\Programs\\acli\\acli.exe\"" || true; \
		else \
			echo "Install Atlassian CLI: https://developer.atlassian.com/cloud/acli/"; \
		fi; \
	fi
	@if command -v codex >/dev/null 2>&1; then \
		echo "Codex CLI detected:"; \
		codex --version || true; \
	else \
		echo "Codex CLI not found. Installing Codex CLI..."; \
		$(NPM) install -g @openai/codex || true; \
	fi
	@if command -v agy >/dev/null 2>&1; then \
		echo "Antigravity CLI detected:"; \
		agy --version || true; \
	else \
		echo "Antigravity CLI not found. Installing Antigravity CLI..."; \
		if [ "$(OS)" = "Windows_NT" ]; then \
			powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "irm https://antigravity.google/cli/install.ps1 | iex" || true; \
		else \
			curl -fsSL https://antigravity.google/cli/install.sh | bash || true; \
		fi; \
	fi

install: doctor ## Install project dependencies
	@echo "Installing project dependencies..."
	cd flight-recorder/packages/flight-recorder && $(NPM) install
	@echo "Install complete."

build: install ## Build project artifacts
	@echo "Building project..."
	cd flight-recorder/packages/flight-recorder && $(NPM) run build --if-present
	@echo "Build complete."

test: install ## Run project tests
	@echo "Running tests..."
	cd flight-recorder/packages/flight-recorder && $(NPM) test --if-present
	@echo "Test step complete."

skill-verify: ## Validate packaged skills
	@echo "Validating skill packages..."
	powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/verify-skills.ps1
	@echo "Skill validation complete."

verify: doctor install build test skill-verify ## Run full verification workflow
	@echo "Verification complete."

clean: ## Remove generated output
	@echo "Cleaning generated files..."
	rm -rf runs dist flight-recorder/packages/flight-recorder/dist || true
	@echo "Removed runs/, dist/, and flight-recorder/dist"
	@echo "Clean complete."

reset: clean install ## Clean generated files and reinstall dependencies
	@echo "Reset complete."
