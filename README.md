# TabWeave MCP

TabWeave attaches to an existing Chrome/Chromium instance over CDP and exposes
54 primary tools plus 21 compatibility aliases through newline-delimited MCP
JSON-RPC on standard input/output. Tool names, schemas, parameters and results
retain the baseline contract; the project and its internal bindings are renamed.

## Install and use

Node.js 18 or newer.

```sh
npm ci
CDP_PORT=9222 npm start
npm test
```

The Chrome instance must already be running with a localhost debugging port.
TabWeave does not launch a user's browser. A client configuration can invoke:

```json
{
  "mcpServers": {
    "tabweave": {
      "command": "node",
      "args": ["/absolute/path/to/TabWeave/launch.cjs"],
      "env": { "CDP_PORT": "9222" }
    }
  }
}
```

## Source organization

- `launch.cjs`: process lifecycle and command entry point.
- `stdio_channel.cjs`: ordered line exchange, EOF handling and parse errors.
- `session_kernel.cjs`: CDP session, documents, frames, console events and dispatch.
- `action_catalog.cjs`: cached tool descriptions and schemas.
- `argument_gate.cjs`: canonical file-path checks and schema validation.
- `actions/`: session, composition, page, input, observation and compatibility tools.
- `checks/`: renamed validation and protocol tests.

The action modules share live session values through accessors; they do not copy
mutable state when configuration, tabs or frames change. Page-evaluated functions
remain self-contained and third-party Playwright names remain intact.

## Behavior and boundaries

Navigation, forms, keyboard/mouse input, human/smart timing, screenshots, cookies,
storage, frame/tab management, assertions, retry/batch/step composition and bounded
nesting remain available. Screenshot buffers are returned in full.

Only the baseline supported JSON Schema checks are enforced: required fields,
declared top-level types and enums. Numeric strings remain accepted for numeric
fields; unimplemented schema features remain unvalidated. Canonical path checks
remain check-time restrictions, not a filesystem sandbox. CDP must stay local;
use an isolated profile for sensitive work.

The local regression suite uses a browser stub. Additional rewrite verification
uses isolated Chrome with synthetic local pages; it does not establish behavior
on every external site. See `VALIDATION.md`, `ORIGIN.md` and `LICENSE`.
