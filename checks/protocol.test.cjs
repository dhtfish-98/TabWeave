const weaveTest = require('node:test');
const weaveAssert = require('node:assert');
const weavePath = require('path');
const weaveFs = require('fs');
const weaveOs = require('os');
const {
  spawn: weaveSpawn
} = require('child_process');
const weaveServerPath = weavePath.join(__dirname, '..', "launch.cjs");
function weaveCreateStubPlaywright(weaveConnected) {
  const weaveStubDir = weaveFs.mkdtempSync(weavePath.join(weaveOs.tmpdir(), 'ubm-dispatch-'));
  const weavePkgDir = weavePath.join(weaveStubDir, 'node_modules', 'playwright');
  weaveFs.mkdirSync(weavePkgDir, {
    recursive: true
  });
  weaveFs.writeFileSync(weavePath.join(weavePkgDir, 'package.json'), '{"name":"playwright","version":"0.0.0-stub","main":"index.js"}\n');
  weaveFs.writeFileSync(weavePath.join(weavePkgDir, 'index.js'), weaveConnected ? `const fixturePage = {
  isClosed: () => false,
  on() {},
  off() {},
  evaluate: async () => {},
  url: () => 'about:blank',
  title: async () => 'Fixture',
  screenshot: async () => Buffer.alloc(80000, 65),
  locator: () => ({
    ariaSnapshot: async () => '- heading "Fixture"'
  })
};
const fixtureContext = {
  pages: () => [fixturePage],
  on() {},
  off() {}
};
module.exports = {
  chromium: {
    connectOverCDP: async () => ({
      contexts: () => [fixtureContext],
      isConnected: () => true,
      on() {}
    })
  }
};` : "module.exports = {\n  chromium: {\n    connectOverCDP() {\n      throw new Error('stub playwright: not connected');\n    }\n  }\n};");
  weaveFs.writeFileSync(weavePath.join(weaveStubDir, 'preload.js'), `const fixtureModule = require('module');
const fixtureOriginal = fixtureModule._load;
fixtureModule._load = function (fixtureName, fixtureParent, fixtureIsMain) {
  if (fixtureName === 'playwright') return require('./node_modules/playwright');
  return fixtureOriginal.call(this, fixtureName, fixtureParent, fixtureIsMain);
};`);
  return weaveStubDir;
}
function weaveCallServer(weaveMessages, weaveConnected = false) {
  return new Promise((weaveResolve, weaveReject) => {
    const weaveStubDir = weaveCreateStubPlaywright(weaveConnected);
    const weaveChild = weaveSpawn(process.execPath, ['--require', weavePath.join(weaveStubDir, 'preload.js'), weaveServerPath], {
      env: {
        ...process.env,
        NODE_PATH: weavePath.join(weaveStubDir, 'node_modules')
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let weaveStdout = '';
    let weaveStderr = '';
    const weaveCleanup = () => weaveFs.rmSync(weaveStubDir, {
      recursive: true,
      force: true
    });
    const weaveTimer = setTimeout(() => {
      weaveChild.kill('SIGKILL');
      weaveCleanup();
      weaveReject(new Error(`server did not exit within 10s; stderr: ${weaveStderr}`));
    }, 10000);
    weaveChild.stdout.on('data', weaveChunk => {
      weaveStdout += weaveChunk;
      if (weaveStdout.split('\n').filter(Boolean).length === weaveMessages.length && weaveStdout.endsWith('\n')) {
        weaveChild.stdin.end();
      }
    });
    weaveChild.stderr.on('data', weaveChunk => {
      weaveStderr += weaveChunk;
    });
    weaveChild.on('error', weaveE => {
      clearTimeout(weaveTimer);
      weaveCleanup();
      weaveReject(weaveE);
    });
    weaveChild.on('close', () => {
      clearTimeout(weaveTimer);
      weaveCleanup();
      try {
        weaveResolve(weaveStdout.split('\n').filter(Boolean).map(weaveLine => JSON.parse(weaveLine)));
      } catch (weaveE) {
        weaveReject(new Error(`unparseable server stdout (${weaveE.message}): ${JSON.stringify(weaveStdout)} stderr: ${weaveStderr}`));
      }
    });
    weaveChild.stdin.write(weaveMessages.map(weaveM => JSON.stringify(weaveM)).join('\n') + '\n');
  });
}
function weaveErrorText(weaveResponse) {
  weaveAssert.ok(weaveResponse, 'no response for this id');
  weaveAssert.ok(weaveResponse.result && Array.isArray(weaveResponse.result.content), `no MCP result: ${JSON.stringify(weaveResponse)}`);
  weaveAssert.strictEqual(weaveResponse.result.isError, true, `expected isError: ${JSON.stringify(weaveResponse)}`);
  return weaveResponse.result.content[0].text;
}
weaveTest('tools/call rejects invalid arguments before the handler runs', async () => {
  const weaveResponses = await weaveCallServer([{
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'navigate',
      arguments: {}
    }
  }, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'navigate',
      arguments: {
        url: 'https://example.com',
        wait_until: 'whenever'
      }
    }
  }, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'set_debug',
      arguments: {
        enabled: 'yes'
      }
    }
  }, {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'upload_file',
      arguments: {
        selector: '#file'
      }
    }
  }, {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'unknown_tool',
      arguments: {}
    }
  }]);
  const weaveById = new Map(weaveResponses.map(weaveR => [weaveR.id, weaveR]));
  weaveAssert.strictEqual(weaveById.size, 5, `unexpected response set: ${JSON.stringify(weaveResponses)}`);
  weaveAssert.strictEqual(weaveErrorText(weaveById.get(1)), 'Error: Invalid arguments for tool "navigate": Missing required argument: "url"');
  weaveAssert.strictEqual(weaveErrorText(weaveById.get(2)), 'Error: Invalid arguments for tool "navigate": Invalid value for "wait_until": expected one of ["load", "domcontentloaded", "networkidle"], got "whenever"');
  weaveAssert.strictEqual(weaveErrorText(weaveById.get(3)), 'Error: Invalid arguments for tool "set_debug": Invalid type for "enabled": expected boolean, got string');
  weaveAssert.strictEqual(weaveErrorText(weaveById.get(4)), 'Error: Invalid arguments for tool "upload_file": Missing required argument: "files"');
  weaveAssert.strictEqual(weaveErrorText(weaveById.get(5)), 'Error: Unknown tool: unknown_tool');
});
weaveTest('composition checks child arguments, unknown tools and nested calls', async () => {
  const weaveInvalid = {
    tool: 'set_debug',
    args: {
      enabled: 'yes'
    }
  };
  const weaveValid = {
    tool: 'set_debug',
    args: {
      enabled: false
    }
  };
  const weaveCall = (weaveId, weaveName, weaveArgs) => ({
    jsonrpc: '2.0',
    id: weaveId,
    method: 'tools/call',
    params: {
      name: weaveName,
      arguments: weaveArgs
    }
  });
  const weaveResponses = await weaveCallServer([weaveCall(1, 'batch', {
    actions: [weaveInvalid, weaveValid, {
      tool: 'toString'
    }, null]
  }), weaveCall(2, 'retry', {
    ...weaveInvalid,
    max_retries: 1
  }), weaveCall(3, 'run_steps', {
    steps: [weaveInvalid, weaveValid],
    stop_on_error: false,
    retry_on_fail: false,
    return_intermediate: true
  }), weaveCall(4, 'batch', {
    actions: [{
      tool: 'retry',
      args: {
        ...weaveInvalid,
        max_retries: 1
      }
    }]
  }), weaveCall(5, 'retry', {
    ...weaveValid,
    max_retries: 1
  }), weaveCall(6, 'run_steps', {
    steps: [{
      tool: 'batch',
      args: {
        actions: []
      }
    }],
    retry_on_fail: false
  }), weaveCall(7, 'retry', {
    tool: 'toString',
    max_retries: 1
  })], true);
  const weaveById = new Map(weaveResponses.map(weaveR => [weaveR.id, weaveR]));
  weaveAssert.strictEqual(weaveById.size, 7);
  const weaveResult = weaveId => JSON.parse(weaveById.get(weaveId).result.content[0].text);
  const weaveBatch = weaveResult(1).results;
  weaveAssert.strictEqual(weaveBatch[0].success, false);
  weaveAssert.match(weaveBatch[0].error, /Invalid arguments for tool "set_debug"/);
  weaveAssert.deepStrictEqual(weaveBatch[1].result, {
    debug: false
  });
  weaveAssert.match(weaveBatch[2].error, /Unknown tool: toString/);
  weaveAssert.match(weaveBatch[3].error, /Each action must be an object/);
  weaveAssert.match(weaveErrorText(weaveById.get(2)), /Invalid arguments for tool "set_debug"/);
  const weaveSteps = weaveResult(3).steps;
  weaveAssert.strictEqual(weaveSteps[0].success, false);
  weaveAssert.match(weaveSteps[0].error, /Invalid arguments for tool "set_debug"/);
  weaveAssert.deepStrictEqual(weaveSteps[1].result, {
    debug: false
  });
  weaveAssert.match(weaveResult(4).results[0].error, /Invalid arguments for tool "set_debug"/);
  weaveAssert.deepStrictEqual(weaveResult(5), {
    success: true,
    attempts: 1,
    result: {
      debug: false
    }
  });
  weaveAssert.match(weaveResult(6).steps[0].error, /batch is not allowed within run_steps/);
  weaveAssert.match(weaveErrorText(weaveById.get(7)), /Unknown tool: toString/);
});
weaveTest('external depth arguments cannot bypass nested composition limits', async () => {
  const weaveCall = (weaveId, weaveName, weaveArgs) => ({
    jsonrpc: '2.0',
    id: weaveId,
    method: 'tools/call',
    params: {
      name: weaveName,
      arguments: weaveArgs
    }
  });
  const weaveMessages = ['invalid', -100, null].map((weaveDepth, weaveIndex) => {
    let weaveAction = {
      tool: 'set_debug',
      args: {
        enabled: true
      }
    };
    for (let weaveI = 0; weaveI < 8; weaveI++) {
      weaveAction = weaveI % 2 ? {
        tool: 'batch',
        args: {
          actions: [weaveAction],
          _depth: weaveDepth
        }
      } : {
        tool: 'retry',
        args: {
          ...weaveAction,
          max_retries: 1,
          _depth: weaveDepth
        }
      };
    }
    return weaveCall(weaveIndex + 1, weaveAction.tool, weaveAction.args);
  });
  const weaveReplies = await weaveCallServer(weaveMessages, true);
  for (const weaveReply of weaveReplies) {
    const weaveText = weaveReply.result.content[0].text;
    weaveAssert.match(weaveText, /nested too deeply/);
    weaveAssert.doesNotMatch(weaveText, /"debug"/);
  }
});
weaveTest('zero retries still executes once and invalid counts are rejected', async () => {
  const weaveCall = (weaveId, weaveRetries) => ({
    jsonrpc: '2.0',
    id: weaveId,
    method: 'tools/call',
    params: {
      name: 'run_steps',
      arguments: {
        steps: [{
          tool: 'set_debug',
          args: {
            enabled: true
          }
        }],
        max_step_retries: weaveRetries,
        return_intermediate: true
      }
    }
  });
  const weaveReplies = await weaveCallServer([weaveCall(1, 0), weaveCall(2, -1), weaveCall(3, 0.5), weaveCall(4, 11)], true);
  const weaveById = new Map(weaveReplies.map(weaveR => [weaveR.id, weaveR]));
  const weaveFirst = JSON.parse(weaveById.get(1).result.content[0].text);
  weaveAssert.strictEqual(weaveFirst.steps[0].attempts, 1);
  weaveAssert.deepStrictEqual(weaveFirst.steps[0].result, {
    debug: true
  });
  for (const weaveId of [2, 3, 4]) weaveAssert.match(weaveErrorText(weaveById.get(weaveId)), /integer from 0 to 10/);
});
weaveTest('inline screenshot preserves the complete buffer above the old limit', async () => {
  const [weaveReply] = await weaveCallServer([{
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'screenshot',
      arguments: {}
    }
  }], true);
  const weaveResult = JSON.parse(weaveReply.result.content[0].text);
  weaveAssert.strictEqual(weaveResult.size, 80000);
  weaveAssert.deepStrictEqual(Buffer.from(weaveResult.screenshot, 'base64'), Buffer.alloc(80000, 65));
});
weaveTest('snapshot uses the supported locator ARIA API', async () => {
  const [weaveReply] = await weaveCallServer([{
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'snapshot',
      arguments: {}
    }
  }], true);
  weaveAssert.deepStrictEqual(JSON.parse(weaveReply.result.content[0].text), {
    snapshot: '- heading "Fixture"',
    format: 'aria-yaml'
  });
});
weaveTest('statistics retain numeric counts across renamed session fields and cleanup', async () => {
  const envelope = (requestIdentifierAudit, actionLabelAudit, parameters = {}) => ({
    jsonrpc: '2.0',
    id: requestIdentifierAudit,
    method: 'tools/call',
    params: {
      name: actionLabelAudit,
      arguments: parameters
    }
  });
  const exchangeRepliesAudit = await weaveCallServer([envelope(1, 'set_debug', {
    enabled: false
  }), envelope(2, 'request_stats'), envelope(3, 'cleanup'), envelope(4, 'request_stats')], true);
  const priorCountsAudit = JSON.parse(exchangeRepliesAudit.find(completionReply => completionReply.id === 2).result.content[0].text);
  weaveAssert.strictEqual(priorCountsAudit.total, 1);
  weaveAssert.strictEqual(priorCountsAudit.success, 1);
  weaveAssert.strictEqual(priorCountsAudit.errors, 0);
  weaveAssert.strictEqual(priorCountsAudit.byTool.set_debug.count, 1);
  weaveAssert.strictEqual(priorCountsAudit.byTool.set_debug.errors, 0);
  weaveAssert.ok(Number.isFinite(priorCountsAudit.byTool.set_debug.avgTime));
  const after = JSON.parse(exchangeRepliesAudit.find(completionReply => completionReply.id === 4).result.content[0].text);
  weaveAssert.strictEqual(after.total, 1);
  weaveAssert.strictEqual(after.byTool.cleanup.count, 1);
  weaveAssert.strictEqual(after.byTool.set_debug, undefined);
});
