ifeq ($(OS),Windows_NT)
  SHELL := C:/Progra~1/Git/bin/bash.exe
else
  SHELL := /bin/bash
endif

.DEFAULT_GOAL := help

.PHONY: help doctor install build test verify clean reset

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

install: doctor ## Install project dependencies
	@echo "Installing project dependencies..."
	npm install --prefix agentic-system-telemetry/packages/agent-bench
	@echo "Install complete."

build: install ## Build project artifacts
	@echo "Building project..."
	npm run build --prefix agentic-system-telemetry/packages/agent-bench --if-present
	@echo "Build complete."

test: install ## Run project tests
	@echo "Running tests..."
	npm test --prefix agentic-system-telemetry/packages/agent-bench --if-present
	@echo "Test step complete."

verify: doctor install build test ## Run full verification workflow
	@echo "Verification complete."

clean: ## Remove generated output
	@echo "Cleaning generated files..."
	rm -rf runs dist agentic-system-telemetry/packages/agent-bench/dist || true
	@echo "Removed runs/, dist/, and agent-bench/dist"
	@echo "Clean complete."

reset: clean install ## Clean generated files and reinstall dependencies
	@echo "Reset complete."
