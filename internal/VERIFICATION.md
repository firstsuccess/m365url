# Internal verification record

Application files are static HTML/CSS/ES modules. MSAL Browser 4.27.0 is vendored from the official @azure/msal-browser registry package. SHA-256 of the minified distribution: 673263007dd6ca02bac01ccb2ad1e9d3622627dc7c16a0fd5b14d6c289297e04. Its MIT license is included.

Deployment wraps unchanged browser assets in a dependency-free Cloudflare Worker so the shared visit counter can use D1. The packaging helper is internal; browser users require no tools or installation. The D1 migration is schema-only; the insert trigger counts only new session UUIDs. No submitted URL, token, IP, or account is stored in D1. The counter is best-effort session counting, not a count of unique people. Repeated renders and reloads in a browser session do not increment it. Storage failures suppress the counter without blocking parsing.

## Checks

- `node tests/core.mjs`: parser fixtures, Unicode/special characters, redirect validation, permission planning, Graph boundaries, mock Shares responses, mock authentication cleanup, translation completeness.
- `node tests/counter.mjs`: real SQLite migration, deduplication trigger, request validation and storage failure.
- Graph/SSO tests are mocked; they do not validate actual consent, another tenant, MFA, conditional access, or permissions in the supplied Entra application.
- Web platform has no confidential-client backend and is explicitly unavailable. Personal OneDrive Graph support is explicitly unavailable. Other Microsoft 365 service links receive generic URL/nested-URL extraction only.
- Local in-app browser could not connect to the Windows loopback preview. Verify the deployed site with browser UI.

## Published browser checks

The public URL was checked in the in-app browser: Japanese parsing of a fictional SharePoint path with spaces, literal percent and hash, copy, English and Simplified Chinese, settings defaults and foreign redirect URI rejection. A 390 x 844 viewport and the normal desktop viewport were visually inspected. The deployed D1 endpoint returned a real numeric total. Counter SQL deduplication is independently covered by the SQLite test; the global total may rise from other browser sessions and deployment previews. No live Microsoft tenant resource or interactive consent flow has been verified. Seventeen core tests and the SQLite counter test pass.

## Official references checked on 2026-11-02

- https://learn.microsoft.com/entra/msal/javascript/browser/cdn-usage (v3+ must be self-hosted or ESM)
- https://learn.microsoft.com/entra/msal/javascript/browser/configuration
- https://learn.microsoft.com/graph/api/shares-get?view=graph-rest-1.0 (delegated Files.ReadWrite)
- https://learn.microsoft.com/graph/api/site-get?view=graph-rest-1.0 (delegated Sites.Read.All)
- https://learn.microsoft.com/graph/api/drive-list?view=graph-rest-1.0
- https://learn.microsoft.com/graph/api/driveitem-get?view=graph-rest-1.0
- https://learn.microsoft.com/graph/api/team-get?view=graph-rest-1.0
- https://learn.microsoft.com/graph/api/channel-list?view=graph-rest-1.0
