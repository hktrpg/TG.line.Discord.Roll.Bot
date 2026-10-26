# Security dependency maintenance

Production deployments use this repository's committed package.json and yarn.lock. Do not maintain separate dependency patches only on a running host.

The October 2026 compatible update pins Axios, body-parser, Engine.IO, js-yaml, xmldom, qs, moment, ip-address, browserslist, follow-redirects, @humanfs/node and brace-expansion to the reviewed patch versions. Docker builds copy yarn.lock and use frozen installation. System Chromium is used; automatic Puppeteer browser downloads are disabled.

Before deployment, run lint, test/security-dependencies.test.js and the related application tests with Node 24.22.1 or a supported newer patched Node. The dependency test includes a separate loopback-only child process for compressed-body handling. The negative control with body-parser 1.20.6 crashed with Z_DATA_ERROR; the patched version survives. It never loads application credentials or contacts a production service.

This update does not eliminate every advisory. A complete public OSV npm snapshot (SHA256 98509a62109a7c1e204399432a2d92c381e793a6abeec2b9c8533b5ee076109c) matched against the updated lock yielded five High and one Moderate package/advisory matches, including development/transitive dependencies. No package inventory was submitted to a remote audit API.

## 2026-10-26 follow-up

- Pin the transitive `basic-ftp` dependency to 6.2.3. `get-uri` 6.0.5 requests
  5.x, so this override is covered by actual loopback FTP downloads using both
  MDTM and directory-listing fallback, including unchanged-content caching.
- Remove the unused `got` resolution. Traversing all production and development
  dependencies found no reachable `got`, `cacheable-request` or
  `http-cache-semantics` consumer. Yarn removed 23 obsolete lock selectors from
  that chain; the only existing dependency version changed is `basic-ftp`.
- The old 5.3.1 parser exceeded the regression child process's three-second
  deadline on a malformed Unix listing. Version 6.2.3 completes the same case.
- A fresh offline `--frozen-lockfile --ignore-scripts` installation succeeds,
  installs `basic-ftp` 6.2.3 and does not install `http-cache-semantics`. Browser
  downloads and lifecycle scripts were disabled during verification.
- A live Yarn/npm audit of the current dependency graph reports three distinct
  High advisories and one Moderate advisory. Yarn counts six High dependency
  paths because the Puppeteer and puppeteer-core paths overlap. This audit
  submitted dependency metadata to the registry; it is separate from the older
  offline OSV snapshot above. GitHub's default-branch alerts will only reflect
  these changes after they reach that branch and GitHub rescans it.

Remaining triage after this follow-up:

- file-type 16.5.4: GHSA-5v7r-6r5c-r473; fixed in 21.3.1, which requires a major API migration.
- extract-zip 2.0.1: GHSA-7pqw-9j4j-h8q3 and GHSA-jmr9-qjv8-65gv; no upstream fixed version in the snapshot.
- zod 3.25.76: GHSA-mrhx-c7xc-m3w5; fixed in 4.6.6, requiring compatibility review of consumers.

Version matches are not proof of exploitability. Full user workflows, fresh container OS advisory checks and independent restore/rollback readiness remain deployment responsibilities.
