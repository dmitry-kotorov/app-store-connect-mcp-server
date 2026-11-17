# App Store Connect MCP Server

MCP server (stdio) exposing App Store Connect API tools. TypeScript, built with `tsc` into `dist/`.

## Build & verify

- `npm run build` — the only automated check; there is no test suite.
- Offline smoke test (no credentials needed — listing tools does not authenticate):
  pipe `initialize`, `notifications/initialized`, `tools/list` JSON-RPC lines into
  `APP_STORE_CONNECT_KEY_ID=x APP_STORE_CONNECT_ISSUER_ID=x APP_STORE_CONNECT_P8_PATH=/nonexistent node dist/src/index.js`.
- Live checks need real credentials via the `APP_STORE_CONNECT_*` env vars (see README). Only exercise
  read tools live; never create/submit/cancel review submissions or create versions against the real
  account without explicit user approval.
- For live checks, reuse the `APP_STORE_CONNECT_*` env of an existing `app-store-connect` MCP server config
  rather than copying key material anywhere. Drive the built server over stdio (same JSON-RPC lines as the
  smoke test plus `tools/call`), or sign a JWT and GET the API directly to compare against raw responses.
- Verify every Apple-side `filter[...]` live before relying on it — some silently return nothing (see
  "API quirks").

## `dist/` is committed

The package is installed from GitHub and runs `dist/src/index.js` directly, and other local projects'
MCP configs point at this checkout's `dist/`. So:

- Always `npm run build` before committing, and commit `dist/` together with `src/`.
- A rebuild immediately changes the tools available to those other projects on their next server restart.

## API spec

- Use Apple's current OpenAPI spec, not the bundled `3.2.json` (Oct 2025, stale — predates the
  IAP/subscription version resources). Download:
  `https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip`
  into a temp dir (it contains `openapi.oas.json`; v4.6 as of Nov 2026).
- The spec's `deprecated` flag is incomplete — Apple's deprecation emails are the source of truth.

## Code conventions

- Layout: `src/handlers/<area>.ts` (one class per area) + `src/types/<area>.ts`, re-exported from the
  respective `index.ts`. Each new tool must be wired in `src/index.ts` in three places: handler field +
  constructor, `buildToolsList()` entry, and the `switch` case (use `formatResponse`). Document it in README.
- **Path ids**: wrap every id interpolated into a request path in `pathId()` (`src/utils/validation.ts`) —
  ids come from tool arguments and a raw `../` could redirect an authenticated request.
- **v1 vs v2**: the axios `baseURL` is pinned to `/v1`. For `/v2/...` resources use the absolute
  `ASC_V2_BASE` prefix from `src/services/appstore-client.ts`; a relative `/v2/...` becomes `/v1/v2/...`.
- Some resources forbid collection GETs (e.g. CPP versions/localizations, IAP/subscription versions) —
  read them via relationship traversal from the parent (`/parents/{id}/children`).
- Use `sanitizeLimit(limit, max)` with the spec's real maximum; nested `limit[...]` params max out at 50.
- API errors surface all `errors[].detail` plus `meta.associatedErrors` (review submission failures put
  per-item reasons there).
- Report files (`/salesReports`, `/financeReports`, analytics segments) are gzip TSV: fetch with
  `client.getFile` / `client.downloadPresignedUrl` (both unpack and decode binary error bodies) and render
  with `shapeReport` (`src/utils/report-table.ts`) so results fit a tool result. Segment URLs are pre-signed
  S3 links — never send the API token to them.
- List tools that can return many items return a `CompactList` (`{id, ...attributes}`, rendered one per line by
  `formatCompact`) rather than the raw JSON:API payload, whose links/relationships dominate its size.

## API quirks (checked live, Nov 2026)

- `appStoreVersionExperimentsV2`: `filter[state]=COMPLETED` returns nothing for tests that read back as
  `COMPLETED` — the state filter is applied locally. Tests created via the v1 experiments API appear in the
  V2 list with the same ids.
- `/financeReports` requires `filter[reportType]` (`FINANCIAL` or `FINANCE_DETAIL`).
- Analytics report instances are not returned in date order, and daily instances overlap (each holds ~2
  days; the next repeats the later one) — dedupe by date when combining.
- No API gives a version's status history or release timestamp; `isLive` in `list_app_store_versions` is
  derived (newest `READY_FOR_DISTRIBUTION` per platform by `createdDate`).
- Sales report product types `F3`/`F7` don't match Apple's documented meanings; don't label them.

## IAP / subscriptions & review submissions (API 4.6)

- Apple removes the v1 IAP/subscription localization, image and `*Submissions` resources from early 2027.
  This server uses only the version-based replacements: `inAppPurchaseVersions`, `subscriptionVersions`,
  `subscriptionGroupVersions` (localizations/images hang off a version).
- Submitting goes through the unified `reviewSubmissions` + `reviewSubmissionItems` flow (≤200 items).
  An item references a **version** id (e.g. inAppPurchaseVersion), not the product id. The
  relationship-key → type table lives in `REVIEW_ITEM_TYPES` (`src/types/submissions.ts`) and is copied
  from the spec — keys are not derivable by pluralizing.
- Status: request shapes are spec-verified; the read tools have not been run live yet, and the write
  tools have never been exercised against the real API.

## Not implemented

- Editing IAP/subscription version localizations and images.
- Asset upload (reservation/upload/commit) for any resource — screenshots/images are managed in the ASC UI.
- Version release history (no API — see "API quirks").

## Open items

- `list_app_store_version_localizations` returns ~250k characters unfiltered; a `CompactList` (as in
  `list_app_store_versions`) would fix it.
- The "return the existing request" (409) path of `create_analytics_report_request` is tested offline only.
- Change requests and delivery notes for this server live in the sibling `gw-appstores-presence` repo
  (`*-asc-mcp-change-request-*.md`, `*-asc-mcp-cr-*-delivery-notes.md`).
