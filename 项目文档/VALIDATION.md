# Verification

## Historical rewrite verification

The baseline is the exact local source commit recorded in ORIGIN.md.

- All 24 original path/schema/dispatch tests pass after renaming.
- Four additional regressions cover numeric statistics and cleanup, ordered
  fragmented UTF-8 input, blank/malformed lines and incomplete-line EOF handling.
- Isolated real Chrome runs exercise all 75 tools in 80 invocations for both
  original and rewritten services. Both complete all invocations successfully.
- The 75-tool catalog, schemas and effective results are compared. Runtime
  timestamps and measured elapsed-time fields are excluded from equality; those
  timings vary between executions. Counts, state, payloads and screenshot buffers
  remain part of the comparison.
- npm packaging and an installed-package consumer are checked separately.

The live fixture uses temporary browser profiles and synthetic localhost pages.
It does not use the user's browser sessions or establish correctness on every
external site. The baseline CDP, path-validation and supported-schema boundaries
remain unchanged. Historical baseline documentation is retained through ORIGIN.md.

The 2026-10-01 recheck independently compared all 75 tool bodies after normalizing
identifier and session-access changes; all matched. Initial drag/screenshot
comparisons varied with browser state. The repeated live run uses a fixed viewport
and device scale, seeded random input, animation-frame settlement, and explicit
visual starting conditions for drag/screenshot. Payloads and screenshot bytes
match with these controls. The product algorithms were not changed by these controls.

## v4.3.1 notification response fix (2026-10-05 JST)

The public v4.3.0 base is commit
`bf5d50985c78f88ff1d348ab22d9f1cfe687f5dd`. A new browser-free regression
feeds a `tools/call` message without `id` through the actual line exchange and
session dispatcher. Before the one-line guard, this test failed: the output
contained `"id":undefined` and the browser connection stub was reached. After
the guard, it emits no line and makes no browser connection. A companion test
checks that a call with `id: 7` still returns a parseable error response with
the same identifier. The two focused cases pass; the complete local `npm test`
suite passes 30/30. The browser dependency is replaced with an in-memory stub;
these checks do not connect to a real browser or the network.

The change is limited to the `tools/call` missing-`id` branch, two regression
tests, package/server version metadata and current documentation. The historical
live Chrome comparison above was not rerun for v4.3.1. Package construction,
remote CI, release and broader protocol behavior are separate evidence gates.
