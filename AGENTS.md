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

Studio is embedded at `/studio`. Schema lives in `src/sanity/schemaTypes/` and is deployed
from that source via `sanity schema deploy` (Studio-managed — do not deploy via the MCP
`deploy_schema` tool, which would diverge). Content: `continent` -> `country` -> `post`,
with document-level PL/EN translations on `post`.

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
- Tests: none by design
- Verify command: pnpm run check
- Review: required
- Review skip paths: spec/, reports/
- Specs: _specs/
- Spec branch: suggest
- Vault: Personal/Spoznione Podroze
