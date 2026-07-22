# Flight Recorder Naming Migration

Avionics Flight Recorder is the product name. Flight Recorder is the short
display name, and Avionics is the umbrella platform.

## Clean Break

The repository will be renamed from `agent-lens` to `avionics-flight-recorder`
when repository administration is available. Until then, the checkout URL is a
temporary hosting detail, not a product name.

The following names were removed in the Flight Recorder release:

| Previous name | Replacement | Policy |
| --- | --- | --- |
| `agent-bench` CLI | `flight-recorder` | Removed; no command alias is provided. |
| `agent-lens` CLI | `flight-recorder` | Removed; no command alias is provided. |
| `@agent-lens/agent-bench` | `@avionics/flight-recorder` | Removed; consumers must update their dependency and lockfile. |
| `AGENT_BENCH_CODEX_MODE` | `FLIGHT_RECORDER_CODEX_MODE` | Removed; update CI and local configuration. |
| `AGENT_BENCH_CODEX_COMMAND` | `FLIGHT_RECORDER_CODEX_COMMAND` | Removed; update CI and local configuration. |
| `agent_lens_telemetry` feature flag | `flight_recorder_telemetry` | Use the new key in all new metadata. |
| legacy APM skill IDs | `flight-recorder-*` skill IDs | Removed; update skill references. |

There is no deprecation alias or grace period. This avoids two competing
identities in command help, package metadata, configuration, or agent assets.

## Artifact Compatibility

Existing `summary.json` and `comparison.json` files remain readable because
the runtime contracts keep their field shapes and comparison/report readers do
not require a product-name field. Existing feature maps are preserved as opaque
metadata, including old feature-key strings.

New JSON Schema identifiers use the Avionics Flight Recorder namespace. Teams
that validate archived artifacts against the previous schema identifier should
retain the previously published schema beside those archives; no artifact
rewrite is required.

## Repository Administration

Repository renaming is an external GitHub administration step and is not
performed by this code change. After the remote rename, update clone URLs,
package documentation, and repository-local safe-directory examples. GitHub
redirects should remain enabled for existing links.
