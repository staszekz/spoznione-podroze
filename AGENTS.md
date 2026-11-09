## Development

Use Node 24 (`nvm use`, pinned in `.nvmrc`). The Sanity CLI (`sanity schema deploy`,
`sanity typegen`, etc.) aborts with SIGABRT (exit 134) on teardown under Node 22 —
a `rolldown@1.1.5` native `napi_call_threadsafe_function` bug on darwin-arm64. The
command's work completes first, but the crash breaks exit codes. Node 24 exits cleanly.

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Sanity

Studio is deployed standalone at https://spoznione-podroze.sanity.studio/ (`pnpm studio:deploy`,
`studioHost` in `sanity.cli.ts`); it is not embedded in the Astro site, so there is no `/studio`
route and no `studioBasePath`. Schema lives in `src/sanity/schemaTypes/` and is deployed
from that source via `sanity schema deploy` (Studio-managed — do not deploy via the MCP
`deploy_schema` tool, which would diverge). Content: `continent` -> `country` -> `post`,
with document-level PL/EN translations on `post`.

## Structure

- `src/pages/`: PL pages at the root, EN pages under `src/pages/en/`. A new page gets both.
- `src/components/`: `.astro` renders static HTML; `.tsx` files are React islands (map,
  continent pills, mobile menu) sharing state through nanostores in `src/stores/`.
- `src/i18n/ui.ts`: every UI string and every route (`routes`, `postPath`, `continentPath`).
  UI text and links come from here, in both languages.
- `src/sanity/lib/queries.ts`: all GROQ, each wrapped in `defineQuery`. Post lists filter
  with the shared `routablePost` fragment, the same condition `getStaticPaths` uses.

## Commands

Scripts live in `package.json`; `README.md` has the overview. The ones with a catch:

- `pnpm run check` writes Biome fixes: it is the local verify. CI runs the read-only
  `pnpm lint:ci`, then `pnpm typecheck`, `pnpm test`, `pnpm build` (`.github/workflows/ci.yml`).
- `pnpm preview:cf` builds and serves `dist/` with Wrangler at `localhost:8787`, applying
  `public/_headers` and the 404 page like production.
- `pnpm smoke <url> [--production | --preview]` checks a deployment over HTTP;
  `pnpm smoke --help` lists the checks.

## Tests

`pnpm test` runs two Vitest projects; CI runs both.

- `unit` (`src/**/*.test.ts`, Node): logic and GROQ. Queries run in memory with `groq-js`
  and a mocked `sanity:client` (`src/sanity/lib/queries.test.ts`).
- `integration` (`src/**/*.test.tsx`, jsdom + Testing Library): React islands working
  together, data as props. `src/test/setup-dom.ts` resets the DOM and the stores per test.

Playwright E2E is planned (LAN-173) and has no command yet.

## Deploy

Cloudflare Workers static assets (`wrangler.jsonc`, no Worker script), built by Workers
Builds: a push to `master` deploys production, a PR gets a `*.workers.dev` preview with
`X-Robots-Tag: noindex`. Rebuild on Sanity publish is not wired yet (LAN-155), so new
content goes live with the next deploy. After a deploy, run
`pnpm smoke https://spoznionepodroze.pl --production`.

## Linear

Project "Spóźnione Podróże", team LAN. Take issues labelled `ready-for-agent`; leave
`human-only` issues to the user. Branch from the issue's Linear branch name and put the ID
(`LAN-123`) in the PR title or body. The user moves issue statuses.

## Guardrails

- Secrets live in `.env`, Cloudflare and GitHub settings; the repo holds only public IDs
  (`src/sanity/env.ts`, `PUBLIC_SANITY_*`).
- In Sanity, agents create drafts; the user publishes.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Agent config

- PR base branch: master
- Tests: light
- Test command: pnpm test
- Verify command: pnpm run check
- Review: required
- Review skip paths: spec/, reports/
- Specs: _specs/
- Spec branch: suggest
- Vault: Personal/Spoznione Podroze
