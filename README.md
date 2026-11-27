# UTAC QA Calendar (QMS-CASS)

UTAC QA Calendar is a web application for planning Customer Audits (CS) and Internal Audits (IA) across seven UTAC sites: `UTL1`, `UTL2`, `UTL2A`, `UTL2B`, `UTL3`, `UTL3A`, and `UTL3T`. It includes Schedule, Table, Summary, Manage, and History views, with Cloudflare Workers and D1 used for the shared deployment.

## Guides

- [User workflows by role — Thai / English with annotated screenshots](docs/User-workflows.html)
- [Thai workflows by user type — Markdown](docs/User-workflows.md)
- [Thai developer workflow — setup, architecture, feature changes, and release](docs/Developer-workflows.md)
- [Thai developer workflow — illustrated HTML with screenshots](docs/Developer-workflows.html)
- [Bilingual Thai / English user manual](docs/User-manual.md)
- [IT engineering and Cloudflare handover](docs/HANDOVER.md)
- [Documentation index](docs/index.md)

## Run locally

```bash
npm ci
npm run dev
```

`npm run dev` starts the Vite frontend with browser-local development data/authentication. It is not the production configuration. For the Worker and local D1 development setup, apply local migrations and run:

```bash
npm run migrate:local
npm run dev:worker
```

Do not connect local development to the production D1 database.

## Build and deploy

```bash
npm run lint
npm run build
npm run deploy
```

`npm run deploy` builds and deploys the Worker and static assets. It does not apply D1 migrations. Review and apply database migrations separately using the IT-approved release process. See the [Cloudflare handover](docs/HANDOVER.md) for ownership, release, migration, recovery, security, and incident procedures.

## Architecture at a glance

- `src/` — React and TypeScript frontend.
- `worker/index.ts` — Cloudflare Worker API and static asset routing.
- `migrations/` — ordered D1 SQL migrations.
- `wrangler.toml` — Worker, static asset, and D1 binding configuration.
- `docs/` — user and engineering documentation.

## Current IT review items

The handover document records items requiring company review, including server-side role enforcement, account lifecycle and registration code handling, password strength/storage, and the browser's cached schedule data. The repository does not by itself confirm the live Cloudflare account, URL, CI/CD setup, or active production deployment.
