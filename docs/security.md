# Security notes

Security stage: public.

## Ignored audit advisories

`pnpm audit` runs in CI and fails on any advisory, so each ignore is a single ID in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`. Remove the entry once a patched version exists.

| Advisory            | Package         | Severity | Reached through                | Why it is ignored                                                                                                                                       |
| ------------------- | --------------- | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GHSA-gcqx-w48m-w2h4 | deepmerge 4.3.1 | low      | `@sveltejs/vite-plugin-svelte` | No patched version exists. Build-time tool only; deepmerge is not in the built site players load. Recheck when deepmerge or the plugin publishes a fix. |

## Overrides

- `minimatch` is forced to 11.0.1 or later (`overrides` in `pnpm-workspace.yaml`) to clear GHSA-g3hv-75wg-m249, because the latest eslint still depends on minimatch 10. Drop the override when eslint requires a patched minimatch.
