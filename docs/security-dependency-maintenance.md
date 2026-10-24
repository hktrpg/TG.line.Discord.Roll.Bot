# Security dependency maintenance

Production deployments use this repository's committed package.json and yarn.lock. Do not maintain separate dependency patches only on a running host.

The October 2026 compatible update pins Axios, body-parser, Engine.IO, js-yaml, xmldom, qs, moment, ip-address, browserslist, follow-redirects, @humanfs/node and brace-expansion to the reviewed patch versions. Docker builds copy yarn.lock and use frozen installation. System Chromium is used; automatic Puppeteer browser downloads are disabled.

Before deployment, run lint, test/security-dependencies.test.js and the related application tests with Node 24.22.1 or a supported newer patched Node. The dependency test includes a separate loopback-only child process for compressed-body handling. The negative control with body-parser 1.20.6 crashed with Z_DATA_ERROR; the patched version survives. It never loads application credentials or contacts a production service.

This update does not eliminate every advisory. A complete public OSV npm snapshot (SHA256 98509a62109a7c1e204399432a2d92c381e793a6abeec2b9c8533b5ee076109c) matched against the updated lock yielded five High and one Moderate package/advisory matches, including development/transitive dependencies. No package inventory was submitted to a remote audit API.

Remaining triage:

- file-type 16.5.4: GHSA-5v7r-6r5c-r473; fixed in 21.3.1, which requires a major API migration.
- extract-zip 2.0.1: GHSA-7pqw-9j4j-h8q3 and GHSA-jmr9-qjv8-65gv; no upstream fixed version in the snapshot.
- basic-ftp 5.3.1: GHSA-c475-qrg2-pj4r; fixed in 6.2.1, requiring compatibility review.
- zod 3.25.76: GHSA-mrhx-c7xc-m3w5; fixed in 4.6.6, requiring compatibility review of consumers.
- http-cache-semantics 4.2.0: GHSA-ch52-4w7c-c8xp; no upstream fixed version in the snapshot. Confirm actual shared-cache exposure before assigning application exploitability.

Version matches are not proof of exploitability. Full user workflows, fresh container OS advisory checks and independent restore/rollback readiness remain deployment responsibilities.
