> 目录已整理：文档在「项目文档」，构建、缓存与暂存输入在「Build」。从仓库根目录运行 `python3 构建.py --build`；如需使用本文原有源码命令，先运行 `python3 构建.py --stage --ci`，再进入 `Build/源码`。暂存会恢复原输入路径。现有版本和历史验证记录按各自提交理解。

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


## Current maintenance record

The current package maintenance name is **dhtfish98**. This package author entry records the present maintenance period. Earlier package/release metadata and historical source-lineage records may retain `bitfish886`; those records are preserved for their original publication periods.

Upstream attribution, third-party notices and licenses remain unchanged. This metadata update does not claim exclusive authorship of inherited material, alter runtime or tests, or change the package version.

Previously recorded engineering issues remain unresolved; this metadata-only update does not claim to repair them.

Actual task authorization, any effect of safeguards on that task, and CVP application eligibility remain **OPEN**. Package construction and existing engineering evidence do not establish CVP approval.
