# Digits

Based on the NYT game by the same name (Discontinued on August 8th, 2023).

## Play

[digits.ihtfy.com](https://digits.ihtfy.com)

## Goal

Combine numbers to reach the target number.

New puzzles have solutions with three or four contributing operations. The
generator tracks each input slot and emits only operations that feed the target.
It replaces computed values with cheaper equal values when that substitution
does not reuse an input slot. Duplicate values are allowed when both contribute.
Players can still find shorter solutions.

Generation retries use seeded randomness. If a search runs out of attempts, the
app retries that puzzle with new numbers, then uses a validated fallback if needed.

Generator changes can change daily targets. Saved games keep their existing
puzzles and progress.

## Development

Use Node.js 24 or newer and pnpm 10.34.6 (pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

```sh
pnpm check
pnpm lint
pnpm test
pnpm audit
pnpm build
pnpm exec playwright install chromium firefox webkit
pnpm test:browser
```

Browser checks cover portrait and landscape phones, tablets, and desktops up to
2560×1440, with full history and revealed solutions, in Chromium, Firefox, and WebKit.
Offline reloads are checked in Chromium and Firefox; WebKit's offline emulation
check is skipped due to [Playwright issue #42775](https://github.com/microsoft/playwright/issues/42775).

## Deploy

After merging a reviewed change and passing checks, run `pnpm build` and
`pnpm ghdeploy` to publish to the existing `gh-pages` branch. The build includes
the custom domain and offline service worker.
