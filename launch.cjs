#!/usr/bin/env node
const { assembleSessionRuntime } = require('./session_kernel.cjs');
const { LineExchange } = require('./stdio_channel.cjs');
const service = assembleSessionRuntime();
let ending = false;
function finishSession(cause) {
  if (ending) return;
  ending = true;
  console.error(`\n[TabWeave MCP] received ${cause} and is closing gracefully (without closing the browser)...`);
  try {
    service.detach();
    console.error('[TabWeave MCP] has been disconnected and the browser remains running');
  } catch (failure) { console.error('[TabWeave MCP] Cleanup error:', failure.message); }
  process.exit(0);
}
process.on('SIGINT', () => finishSession('SIGINT'));
process.on('SIGTERM', () => finishSession('SIGTERM'));
process.on('uncaughtException', failure => {
  console.error('[TabWeave MCP] Uncaught exception:', failure.message);
  if (!ending) finishSession('uncaughtException');
});
process.on('unhandledRejection', failure => console.error('[TabWeave MCP] Unhandled Promise rejection:', failure));
console.error('[TabWeave MCP v4.3.1] Starting... (54 tools + 21 aliases)');
new LineExchange(service.answer).open();
