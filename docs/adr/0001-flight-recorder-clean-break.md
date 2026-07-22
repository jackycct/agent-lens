# ADR 0001: Adopt Flight Recorder as a clean-break identity

## Status

Accepted

## Decision

Use Avionics Flight Recorder as the product name and `flight-recorder` as the
only CLI. Publish the package as `@avionics/flight-recorder`. Do not provide
aliases for prior command, package, environment-variable, or APM skill names.

## Consequences

Consumers must update commands, dependencies, environment variables, and
skill references together. Existing run and comparison artifacts remain
readable because their data contracts are unchanged. The GitHub repository
rename remains a separate administrative operation.
