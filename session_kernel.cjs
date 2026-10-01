function weaveCreateSession() {
  const {
    actionDescriptions: actionDescriptions,
    invocationSchema: invocationSchema
  } = require('./action_catalog.cjs');
  const {
    chromium: weaveChromium
  } = require('playwright');
  const weaveFs = require('fs');
  const weaveOs = require('os');
  const {
    approveLocation,
    inspectInvocation
  } = require("./argument_gate.cjs");
  let QUICK_DEADLINE = parseInt(process.env.FAST_TIMEOUT) || 3000;
  let NORMAL_DEADLINE = parseInt(process.env.DEFAULT_TIMEOUT) || 5000;
  let EXTENDED_DEADLINE = parseInt(process.env.LONG_TIMEOUT) || 10000;
  let TRACE_ENABLED = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
  const invocationTotals = {
    callCount: 0,
    completedCount: 0,
    failedCount: 0,
    elapsedTotal: 0,
    perAction: new Map()
  };
  function traceEvent(...weaveArgs) {
    if (TRACE_ENABLED) {
      console.error('[DEBUG]', new Date().toISOString(), ...weaveArgs);
    }
  }
  function tallyInvocation(weaveToolName, weaveDuration, weaveSuccess) {
    invocationTotals.callCount++;
    invocationTotals.elapsedTotal += weaveDuration;
    if (weaveSuccess) {
      invocationTotals.completedCount++;
    } else {
      invocationTotals.failedCount++;
    }
    if (!invocationTotals.perAction.has(weaveToolName)) {
      invocationTotals.perAction.set(weaveToolName, {
        callCount: 0,
        elapsedTotal: 0,
        failedCount: 0
      });
    }
    const weaveToolStats = invocationTotals.perAction.get(weaveToolName);
    weaveToolStats.callCount++;
    weaveToolStats.elapsedTotal += weaveDuration;
    if (!weaveSuccess) weaveToolStats.failedCount++;
  }
  const DEBUG_PORT = process.env.CDP_PORT || 9222;
  const DEBUG_ADDRESS = `http://127.0.0.1:${DEBUG_PORT}`;
  process.env.NO_PROXY = '127.0.0.1,localhost';
  process.env.no_proxy = '127.0.0.1,localhost';
  const SELECT_EVERYTHING = weaveOs.platform() === 'darwin' ? 'Meta+a' : 'Control+a';
  let browserLink = null;
  let sessionContext = null;
  let currentDocument = null;
  let surfaceStack = [];
  let documentPool = [];
  let consoleObservers = new Map();
  const CONSOLE_CAPACITY = 100;
  let consoleRing = new Array(CONSOLE_CAPACITY);
  let consoleCursor = 0;
  let consoleLength = 0;
  function appendConsoleEvent(weaveEntry) {
    consoleRing[consoleCursor] = weaveEntry;
    consoleCursor = (consoleCursor + 1) % CONSOLE_CAPACITY;
    if (consoleLength < CONSOLE_CAPACITY) consoleLength++;
  }
  function recentConsoleEvents(weaveLimit) {
    const weaveCount = Math.min(weaveLimit, consoleLength);
    const weaveStart = (consoleCursor - consoleLength + CONSOLE_CAPACITY) % CONSOLE_CAPACITY;
    const weaveResult = [];
    for (let weaveI = consoleLength - weaveCount; weaveI < consoleLength; weaveI++) {
      weaveResult.push(consoleRing[(weaveStart + weaveI) % CONSOLE_CAPACITY]);
    }
    return weaveResult;
  }
  function resetConsoleEvents() {
    consoleLength = 0;
    consoleCursor = 0;
  }
  let documentObserver = null;
  function openDocuments() {
    for (let weaveI = documentPool.length - 1; weaveI >= 0; weaveI--) {
      if (documentPool[weaveI].isClosed()) {
        unobserveConsole(documentPool[weaveI]);
        documentPool.splice(weaveI, 1);
      }
    }
    return documentPool;
  }
  function activeSurface() {
    return surfaceStack.length > 0 ? surfaceStack[surfaceStack.length - 1] : currentDocument;
  }
  function locateSurface() {
    const weaveP = requireDocument();
    const weaveCtx = surfaceStack.length > 0 ? surfaceStack[surfaceStack.length - 1] : weaveP;
    return {
      document: weaveP,
      surface: weaveCtx
    };
  }
  function summarizeAction(weaveTool, weaveResult) {
    if (!weaveResult || typeof weaveResult !== 'object') return undefined;
    switch (weaveTool) {
      case 'click':
        return [weaveResult.elementText && `"${weaveResult.elementText}"`, weaveResult.url].filter(Boolean).join(' → ') || 'ok';
      case 'type':
        return weaveResult.currentValue !== undefined ? `value="${weaveResult.currentValue}"` : 'ok';
      case 'fill':
        return weaveResult.currentValue !== undefined ? `value="${weaveResult.currentValue}"` : 'ok';
      case 'navigate':
        return `${weaveResult.title || ''} (${weaveResult.finalUrl || weaveResult.navigated || ''})`.slice(0, 120);
      case 'get_page':
        return weaveResult.url || weaveResult.title || weaveResult.text?.slice(0, 100) || JSON.stringify(weaveResult).slice(0, 100);
      case 'get':
        return JSON.stringify(weaveResult).slice(0, 150);
      case 'get_text':
        return (weaveResult.text || '').slice(0, 100);
      case 'eval':
        return typeof weaveResult.result === 'string' ? weaveResult.result.slice(0, 150) : JSON.stringify(weaveResult.result).slice(0, 100);
      case 'find':
        return `found=${weaveResult.found}/${weaveResult.total}`;
      case 'check':
        return `${weaveResult.state}=${weaveResult.result}`;
      case 'assert':
        return weaveResult.passed ? 'passed' : `failed: ${weaveResult.message || ''}`.slice(0, 80);
      case 'wait':
        return `waited ${weaveResult.waited || ''}ms`;
      case 'select':
        return weaveResult.selected || 'ok';
      case 'status':
        return weaveResult.connected ? `connected, ${weaveResult.tabCount} tabs` : 'disconnected';
      case 'list_tabs':
        return `${weaveResult.count} tabs`;
      case 'switch_tab':
        return `tab ${weaveResult.switched}`;
      case 'screenshot':
        return 'captured';
      case 'press_key':
        return weaveResult.pressed || 'ok';
      case 'hotkey':
        return weaveResult.pressed || 'ok';
      default:
        return undefined;
    }
  }
  function withinFrame() {
    return surfaceStack.length > 0;
  }
  function sampleInteger(weaveMin, weaveMax) {
    return Math.floor(Math.random() * (weaveMax - weaveMin + 1)) + weaveMin;
  }
  function pauseFor(weaveMs) {
    return new Promise(weaveResolve => setTimeout(weaveResolve, weaveMs));
  }
  function documentAddress(weaveP, weaveFallback = 'unknown') {
    try {
      return weaveP && !weaveP.isClosed() ? weaveP.url() : weaveFallback;
    } catch (weaveE) {
      return weaveFallback;
    }
  }
  async function documentTitle(weaveP, weaveFallback = '') {
    try {
      return weaveP && !weaveP.isClosed() ? await weaveP.title() : weaveFallback;
    } catch (weaveE) {
      return weaveFallback;
    }
  }
  function requireDocument() {
    if (!currentDocument) throw new Error('The browser is not connected or there is no active page');
    if (currentDocument.isClosed()) {
      const weaveValidPage = documentPool.find(weaveP => !weaveP.isClosed());
      if (weaveValidPage) {
        currentDocument = weaveValidPage;
        surfaceStack = [];
      } else {
        currentDocument = null;
        documentPool = [];
        surfaceStack = [];
        throw new Error('All pages are closed');
      }
    }
    return currentDocument;
  }
  function quoteSelector(weaveText) {
    return weaveText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  }
  function encodeValue(weaveObj) {
    const weaveSeen = new WeakSet();
    return JSON.stringify(weaveObj, (weaveKey, weaveValue) => {
      if (weaveValue === undefined) return '__undefined__';
      if (weaveValue === null) return null;
      if (typeof weaveValue === 'function') return '__function__';
      if (typeof weaveValue === 'symbol') return weaveValue.toString();
      if (typeof weaveValue === 'bigint') return weaveValue.toString() + 'n';
      if (typeof weaveValue === 'object' && weaveValue !== null) {
        if (weaveSeen.has(weaveValue)) return '__circular__';
        weaveSeen.add(weaveValue);
      }
      return weaveValue;
    });
  }
  function numericValue(weaveVal, weaveDefaultVal, weaveAllowFloat = false) {
    if (typeof weaveVal === 'number') {
      if (!Number.isFinite(weaveVal)) return weaveDefaultVal;
      return weaveAllowFloat ? weaveVal : Math.floor(weaveVal);
    }
    if (typeof weaveVal === 'string') {
      const weaveN = weaveAllowFloat ? parseFloat(weaveVal) : parseInt(weaveVal, 10);
      if (!Number.isFinite(weaveN)) return weaveDefaultVal;
      return weaveN;
    }
    return weaveDefaultVal;
  }
  function curveCoordinate(weaveT, weaveP0, weaveP1, weaveP2, weaveP3) {
    const weaveU = 1 - weaveT;
    return weaveU * weaveU * weaveU * weaveP0 + 3 * weaveU * weaveU * weaveT * weaveP1 + 3 * weaveU * weaveT * weaveT * weaveP2 + weaveT * weaveT * weaveT * weaveP3;
  }
  function pointerTrajectory(weaveStartX, weaveStartY, weaveEndX, weaveEndY) {
    const weavePoints = [];
    const weaveSteps = sampleInteger(15, 25);
    const weaveCp1x = weaveStartX + (weaveEndX - weaveStartX) * 0.3 + sampleInteger(-50, 50);
    const weaveCp1y = weaveStartY + (weaveEndY - weaveStartY) * 0.1 + sampleInteger(-30, 30);
    const weaveCp2x = weaveStartX + (weaveEndX - weaveStartX) * 0.7 + sampleInteger(-50, 50);
    const weaveCp2y = weaveStartY + (weaveEndY - weaveStartY) * 0.9 + sampleInteger(-30, 30);
    for (let weaveI = 0; weaveI <= weaveSteps; weaveI++) {
      const weaveT = weaveI / weaveSteps;
      const weaveJitterX = sampleInteger(-2, 2);
      const weaveJitterY = sampleInteger(-2, 2);
      const weaveX = Math.max(0, curveCoordinate(weaveT, weaveStartX, weaveCp1x, weaveCp2x, weaveEndX) + weaveJitterX);
      const weaveY = Math.max(0, curveCoordinate(weaveT, weaveStartY, weaveCp1y, weaveCp2y, weaveEndY) + weaveJitterY);
      weavePoints.push({
        x: weaveX,
        y: weaveY
      });
    }
    return weavePoints;
  }
  function observeConsole(weaveTargetPage) {
    if (consoleObservers.has(weaveTargetPage)) {
      const weaveOldListener = consoleObservers.get(weaveTargetPage);
      weaveTargetPage.off('console', weaveOldListener);
    }
    const weaveListener = weaveMsg => {
      try {
        appendConsoleEvent({
          type: weaveMsg.type(),
          text: weaveMsg.text(),
          timestamp: Date.now()
        });
      } catch (weaveE) {
        appendConsoleEvent({
          type: 'error',
          text: '[Unable to get message]',
          timestamp: Date.now()
        });
      }
    };
    weaveTargetPage.on('console', weaveListener);
    consoleObservers.set(weaveTargetPage, weaveListener);
  }
  function unobserveConsole(weaveTargetPage) {
    if (consoleObservers.has(weaveTargetPage)) {
      const weaveListener = consoleObservers.get(weaveTargetPage);
      weaveTargetPage.off('console', weaveListener);
      consoleObservers.delete(weaveTargetPage);
    }
  }
  const closureObservers = new WeakSet();
  function observeClosure(weaveTargetPage) {
    if (closureObservers.has(weaveTargetPage)) return;
    closureObservers.add(weaveTargetPage);
    weaveTargetPage.on('close', () => {
      const weaveIdx = documentPool.indexOf(weaveTargetPage);
      if (weaveIdx >= 0) {
        unobserveConsole(weaveTargetPage);
        documentPool.splice(weaveIdx, 1);
        if (currentDocument === weaveTargetPage) {
          currentDocument = documentPool.find(weaveP => !weaveP.isClosed()) || null;
          surfaceStack = [];
        }
      }
    });
  }
  function resolveLocator(weaveCtx, weaveSelector) {
    if (!weaveCtx) throw new Error('Context does not exist');
    if (!weaveSelector || typeof weaveSelector !== 'string') {
      throw new Error('selector parameter is invalid');
    }
    if (weaveSelector.startsWith('id=')) {
      const weaveId = weaveSelector.slice(3).trim();
      if (!weaveId) throw new Error('id= selector content cannot be empty');
      const weaveEscapedId = weaveId.replace(/([.:\[\]>+~#(){}|^$*=!,/ ])/g, '\\$1');
      return weaveCtx.locator(`#${weaveEscapedId}`).first();
    }
    if (weaveSelector.startsWith('data-testid=')) {
      const weaveTestId = weaveSelector.slice(12).trim();
      if (!weaveTestId) throw new Error('data-testid= selector content cannot be empty');
      return weaveCtx.getByTestId(weaveTestId).first();
    }
    if (weaveSelector.startsWith('text=')) {
      const weaveTextContent = weaveSelector.slice(5);
      if (!weaveTextContent) throw new Error('text= selector content cannot be empty');
      return weaveCtx.getByText(weaveTextContent, {
        exact: false
      }).first();
    }
    if (weaveSelector.startsWith('placeholder=')) {
      const weavePlaceholder = weaveSelector.slice(12);
      if (!weavePlaceholder) throw new Error('placeholder= selector content cannot be empty');
      return weaveCtx.getByPlaceholder(weavePlaceholder).first();
    }
    if (weaveSelector.startsWith('label=')) {
      const weaveLabel = weaveSelector.slice(6);
      if (!weaveLabel) throw new Error('label= selector content cannot be empty');
      return weaveCtx.getByLabel(weaveLabel).first();
    }
    if (weaveSelector.startsWith('role=')) {
      const weaveParts = weaveSelector.slice(5).split('[');
      const weaveRole = weaveParts[0].trim();
      if (!weaveRole) throw new Error('role= selector role cannot be empty');
      if (weaveParts.length > 1 && weaveParts[1].includes('name=')) {
        const weaveNamePart = weaveParts[1].split('name=')[1];
        if (weaveNamePart) {
          const weaveName = weaveNamePart.replace(/[\]"']/g, '').trim();
          if (weaveName) {
            return weaveCtx.getByRole(weaveRole, {
              name: weaveName
            }).first();
          }
        }
      }
      return weaveCtx.getByRole(weaveRole).first();
    }
    return weaveCtx.locator(weaveSelector).first();
  }
  function resolveLocators(weaveCtx, weaveSelector) {
    if (!weaveCtx) throw new Error('Context does not exist');
    if (!weaveSelector || typeof weaveSelector !== 'string') {
      throw new Error('selector parameter is invalid');
    }
    if (weaveSelector.startsWith('id=')) {
      const weaveId = weaveSelector.slice(3).trim();
      if (!weaveId) throw new Error('id= selector content cannot be empty');
      const weaveEscapedId = weaveId.replace(/([.:\[\]>+~#(){}|^$*=!,/ ])/g, '\\$1');
      return weaveCtx.locator(`#${weaveEscapedId}`);
    }
    if (weaveSelector.startsWith('data-testid=')) {
      return weaveCtx.getByTestId(weaveSelector.slice(12).trim());
    }
    if (weaveSelector.startsWith('text=')) {
      return weaveCtx.getByText(weaveSelector.slice(5), {
        exact: false
      });
    }
    if (weaveSelector.startsWith('placeholder=')) {
      return weaveCtx.getByPlaceholder(weaveSelector.slice(12));
    }
    if (weaveSelector.startsWith('label=')) {
      return weaveCtx.getByLabel(weaveSelector.slice(6));
    }
    if (weaveSelector.startsWith('role=')) {
      const weaveParts = weaveSelector.slice(5).split('[');
      const weaveRole = weaveParts[0].trim();
      if (weaveParts.length > 1 && weaveParts[1].includes('name=')) {
        const weaveNamePart = weaveParts[1].split('name=')[1];
        if (weaveNamePart) {
          const weaveName = weaveNamePart.replace(/[\]"']/g, '').trim();
          if (weaveName) return weaveCtx.getByRole(weaveRole, {
            name: weaveName
          });
        }
      }
      return weaveCtx.getByRole(weaveRole);
    }
    return weaveCtx.locator(weaveSelector);
  }
  const weaveSessionAccess = {
    get currentDocument() {
      return currentDocument;
    },
    set currentDocument(weaveReplacement) {
      currentDocument = weaveReplacement;
    },
    get browserLink() {
      return browserLink;
    },
    set browserLink(weaveReplacement) {
      browserLink = weaveReplacement;
    },
    get documentAddress() {
      return documentAddress;
    },
    get documentTitle() {
      return documentTitle;
    },
    get openDocuments() {
      return openDocuments;
    },
    get withinFrame() {
      return withinFrame;
    },
    get surfaceStack() {
      return surfaceStack;
    },
    set surfaceStack(weaveReplacement) {
      surfaceStack = weaveReplacement;
    },
    get QUICK_DEADLINE() {
      return QUICK_DEADLINE;
    },
    set QUICK_DEADLINE(weaveReplacement) {
      QUICK_DEADLINE = weaveReplacement;
    },
    get NORMAL_DEADLINE() {
      return NORMAL_DEADLINE;
    },
    set NORMAL_DEADLINE(weaveReplacement) {
      NORMAL_DEADLINE = weaveReplacement;
    },
    get EXTENDED_DEADLINE() {
      return EXTENDED_DEADLINE;
    },
    set EXTENDED_DEADLINE(weaveReplacement) {
      EXTENDED_DEADLINE = weaveReplacement;
    },
    get DEBUG_PORT() {
      return DEBUG_PORT;
    },
    get TRACE_ENABLED() {
      return TRACE_ENABLED;
    },
    set TRACE_ENABLED(weaveReplacement) {
      TRACE_ENABLED = weaveReplacement;
    },
    get numericValue() {
      return numericValue;
    },
    get detachSession() {
      return detachSession;
    },
    get attachSession() {
      return attachSession;
    },
    get consoleLength() {
      return consoleLength;
    },
    set consoleLength(weaveReplacement) {
      consoleLength = weaveReplacement;
    },
    get invocationTotals() {
      return invocationTotals;
    },
    get resetConsoleEvents() {
      return resetConsoleEvents;
    },
    get requireDocument() {
      return requireDocument;
    },
    get activeSurface() {
      return activeSurface;
    },
    get locateSurface() {
      return locateSurface;
    },
    get resolveLocator() {
      return resolveLocator;
    },
    get pauseFor() {
      return pauseFor;
    },
    get sampleInteger() {
      return sampleInteger;
    },
    get pointerTrajectory() {
      return pointerTrajectory;
    },
    get SELECT_EVERYTHING() {
      return SELECT_EVERYTHING;
    },
    get traceEvent() {
      return traceEvent;
    },
    get quoteSelector() {
      return quoteSelector;
    },
    get resolveLocators() {
      return resolveLocators;
    },
    get actionTable() {
      return actionTable;
    },
    get sessionContext() {
      return sessionContext;
    },
    set sessionContext(weaveReplacement) {
      sessionContext = weaveReplacement;
    },
    get documentPool() {
      return documentPool;
    },
    set documentPool(weaveReplacement) {
      documentPool = weaveReplacement;
    },
    get observeConsole() {
      return observeConsole;
    },
    get observeClosure() {
      return observeClosure;
    },
    get approveLocation() {
      return approveLocation;
    },
    get encodeValue() {
      return encodeValue;
    },
    get requireInvocation() {
      return requireInvocation;
    },
    get summarizeAction() {
      return summarizeAction;
    },
    get recentConsoleEvents() {
      return recentConsoleEvents;
    }
  };
  const actionTable = Object.assign({}, require('./actions/session_ops.cjs')(weaveSessionAccess), require('./actions/composition_ops.cjs')(weaveSessionAccess), require('./actions/page_ops.cjs')(weaveSessionAccess), require('./actions/input_ops.cjs')(weaveSessionAccess), require('./actions/observation_ops.cjs')(weaveSessionAccess), require('./actions/compatibility_ops.cjs')(weaveSessionAccess));
  async function attachSession() {
    detachSession();
    try {
      browserLink = await weaveChromium.connectOverCDP(DEBUG_ADDRESS);
      browserLink.close = async () => {
        console.error("[TabWeave MCP] Intercept browser.close() — does not close the user's browser, only disconnects");
      };
      const weaveContexts = browserLink.contexts();
      if (weaveContexts.length > 0) {
        sessionContext = weaveContexts[0];
        sessionContext.close = async () => {
          console.error("[TabWeave MCP] Interception context.close() — does not close user context");
        };
        const weavePages = sessionContext.pages();
        if (weavePages.length > 0) {
          currentDocument = weavePages[0];
          documentPool = [...weavePages];
          for (const weaveP of documentPool) {
            if (weaveP.isClosed()) continue;
            observeConsole(weaveP);
          }
          documentObserver = weaveNewPage => {
            if (!documentPool.includes(weaveNewPage)) {
              documentPool.push(weaveNewPage);
              observeConsole(weaveNewPage);
              observeClosure(weaveNewPage);
            }
          };
          sessionContext.on('page', documentObserver);
          browserLink.on('disconnected', () => {
            console.error("[TabWeave MCP] Browser connection disconnected (browser still running)");
            detachSession();
          });
          for (const weaveP of documentPool) {
            observeClosure(weaveP);
          }
          console.error("[TabWeave MCP] Connection successful, number of pages:", documentPool.length);
          return true;
        }
      }
      throw new Error('No page available');
    } catch (weaveE) {
      console.error("[TabWeave MCP] Connection failed:", weaveE.message);
      detachSession();
      return false;
    }
  }
  function detachSession() {
    if (sessionContext && documentObserver) {
      try {
        sessionContext.off('page', documentObserver);
      } catch (weaveE) {}
    }
    documentObserver = null;
    for (const [weaveP, weaveListener] of consoleObservers) {
      try {
        weaveP.off('console', weaveListener);
      } catch (weaveE) {}
    }
    consoleObservers.clear();
    browserLink = null;
    sessionContext = null;
    currentDocument = null;
    documentPool = [];
    surfaceStack = [];
    resetConsoleEvents();
  }
  function requireInvocation(weaveName, weaveArgs) {
    if (!Object.hasOwn(actionTable, weaveName) || typeof actionTable[weaveName] !== 'function') {
      throw new Error(`Unknown tool: ${weaveName}`);
    }
    const weaveCheck = inspectInvocation(weaveName, weaveArgs, invocationSchema(weaveName));
    if (!weaveCheck.valid) {
      throw new Error(`Invalid arguments for tool "${weaveName}": ${weaveCheck.errors.join('; ')}`);
    }
  }
  async function dispatchEnvelope(weaveMessage) {
    const {
      method: weaveMethod,
      params: weaveParams,
      id: weaveId
    } = weaveMessage;
    switch (weaveMethod) {
      case 'initialize':
        const weaveConnected = await attachSession();
        return {
          jsonrpc: '2.0',
          id: weaveId,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "tabweave",
              version: '4.3.0'
            }
          }
        };
      case 'notifications/initialized':
        return null;
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: weaveId,
          result: {
            tools: actionDescriptions()
          }
        };
      case 'tools/call':
        const {
          name: weaveName,
          arguments: weaveArgs
        } = weaveParams;
        const weaveStartTime = Date.now();
        const weaveIdJson = JSON.stringify(weaveId);
        try {
          requireInvocation(weaveName, weaveArgs);
        } catch (weaveError) {
          const weaveErrText = `Error: ${weaveError.message}`;
          return `{"jsonrpc":"2.0","id":${weaveIdJson},"result":{"content":[{"type":"text","text":${JSON.stringify(weaveErrText)}}],"isError":true}}`;
        }
        if (TRACE_ENABLED) {
          traceEvent(`Call tool: ${weaveName}`, weaveArgs ? JSON.stringify(weaveArgs).slice(0, 100) : '{}');
        }
        if (!browserLink || !browserLink.isConnected()) {
          const weaveReconnected = await attachSession();
          if (!weaveReconnected) {
            const weaveErrText = `Error: Unable to connect to the browser, please make sure Chrome is started and the debugging port is enabled (--remote-debugging-port=${DEBUG_PORT})`;
            return `{"jsonrpc":"2.0","id":${weaveIdJson},"result":{"content":[{"type":"text","text":${JSON.stringify(weaveErrText)}}],"isError":true}}`;
          }
        }
        try {
          const weaveResult = await actionTable[weaveName](weaveArgs || {});
          const weaveDuration = Date.now() - weaveStartTime;
          tallyInvocation(weaveName, weaveDuration, true);
          if (TRACE_ENABLED) traceEvent(`Tool completed: ${weaveName}, time taken: ${weaveDuration}ms`);
          const weaveResultJson = JSON.stringify(weaveResult);
          return `{"jsonrpc":"2.0","id":${weaveIdJson},"result":{"content":[{"type":"text","text":${JSON.stringify(weaveResultJson)}}]}}`;
        } catch (weaveToolError) {
          const weaveDuration = Date.now() - weaveStartTime;
          tallyInvocation(weaveName, weaveDuration, false);
          if (TRACE_ENABLED) traceEvent(`Tool error: ${weaveName}, time taken: ${weaveDuration}ms, error: ${weaveToolError.message}`);
          const weaveErrText = `Error: ${weaveToolError.message}`;
          return `{"jsonrpc":"2.0","id":${weaveIdJson},"result":{"content":[{"type":"text","text":${JSON.stringify(weaveErrText)}}],"isError":true}}`;
        }
      default:
        return {
          jsonrpc: '2.0',
          id: weaveId,
          error: {
            code: -32601,
            message: `Unknown method: ${weaveMethod}`
          }
        };
    }
  }
  async function answerEnvelope(weaveMessage) {
    try {
      return await dispatchEnvelope(weaveMessage);
    } catch (weaveE) {
      return {
        jsonrpc: '2.0',
        id: weaveMessage.id,
        error: {
          code: -32000,
          message: weaveE.message || 'Unknown error'
        }
      };
    }
  }
  return {
    answer: answerEnvelope,
    detach: detachSession,
    describe: actionDescriptions
  };
}
module.exports = {
  assembleSessionRuntime: weaveCreateSession
};
