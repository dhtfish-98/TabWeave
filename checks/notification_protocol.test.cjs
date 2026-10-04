const spec = require('node:test');
const verify = require('node:assert/strict');
const Module = require('node:module');
const { PassThrough } = require('node:stream');
const { LineExchange } = require('../stdio_channel.cjs');
const { assembleSessionRuntime } = require('../session_kernel.cjs');

function offlineRuntime() {
  const originalLoad = Module._load;
  let browserAttempts = 0;
  Module._load = function(request, parent, isMain) {
    if (request === 'playwright') {
      return { chromium: { connectOverCDP() {
        browserAttempts++;
        throw new Error('Browser access is disabled for this protocol test');
      } } };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return { runtime: assembleSessionRuntime(), browserAttempts: () => browserAttempts };
  } finally {
    Module._load = originalLoad;
  }
}

async function exchange(message, runtime) {
  const incoming = new PassThrough();
  const outgoing = new PassThrough();
  const diagnostics = new PassThrough();
  let transcript = '';
  outgoing.on('data', fragment => { transcript += fragment; });
  diagnostics.resume();
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  new LineExchange(runtime.answer, incoming, outgoing, diagnostics, finish).open();
  incoming.end(JSON.stringify(message) + '\n');
  await completed;
  return transcript;
}

spec('tools/call without an id is silent and never connects to a browser', async () => {
  const { runtime, browserAttempts } = offlineRuntime();
  const transcript = await exchange({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { name: 'set_debug', arguments: { enabled: true } }
  }, runtime);
  verify.equal(transcript, '');
  verify.equal(browserAttempts(), 0);
});

spec('tools/call with an id retains its parseable response', async () => {
  const { runtime, browserAttempts } = offlineRuntime();
  const transcript = await exchange({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'unknown_tool', arguments: {} }
  }, runtime);
  verify.deepEqual(JSON.parse(transcript.trim()), {
    jsonrpc: '2.0',
    id: 7,
    result: {
      content: [{ type: 'text', text: 'Error: Unknown tool: unknown_tool' }],
      isError: true
    }
  });
  verify.equal(browserAttempts(), 0);
});
