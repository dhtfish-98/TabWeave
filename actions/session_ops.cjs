module.exports = weaveSessionAccess => ({
  async status() {
    const weaveHasValidPage = !!weaveSessionAccess.currentDocument && !weaveSessionAccess.currentDocument.isClosed();
    let weaveConnected = false;
    try {
      weaveConnected = !!weaveSessionAccess.browserLink && weaveSessionAccess.browserLink.isConnected();
    } catch (weaveE) {
      weaveConnected = false;
    }
    let weaveCurrentUrl = null;
    let weaveTitle = null;
    if (weaveHasValidPage) {
      weaveCurrentUrl = weaveSessionAccess.documentAddress(weaveSessionAccess.currentDocument);
      weaveTitle = await weaveSessionAccess.documentTitle(weaveSessionAccess.currentDocument);
    }
    return {
      connected: weaveConnected,
      hasPage: weaveHasValidPage,
      url: weaveCurrentUrl,
      title: weaveTitle,
      tabCount: weaveSessionAccess.openDocuments().length,
      inFrame: weaveSessionAccess.withinFrame(),
      frameDepth: weaveSessionAccess.surfaceStack.length
    };
  },
  async get_config() {
    return {
      timeouts: {
        fast: weaveSessionAccess.QUICK_DEADLINE,
        default: weaveSessionAccess.NORMAL_DEADLINE,
        long: weaveSessionAccess.EXTENDED_DEADLINE
      },
      cdpPort: weaveSessionAccess.DEBUG_PORT,
      debug: weaveSessionAccess.TRACE_ENABLED,
      inFrame: weaveSessionAccess.withinFrame()
    };
  },
  async set_config({
    fast_timeout: weaveFast_timeout,
    default_timeout: weaveDefault_timeout,
    long_timeout: weaveLong_timeout
  }) {
    const weaveChanges = [];
    if (weaveFast_timeout !== undefined) {
      weaveSessionAccess.QUICK_DEADLINE = weaveSessionAccess.numericValue(weaveFast_timeout, weaveSessionAccess.QUICK_DEADLINE);
      weaveChanges.push('fast_timeout');
    }
    if (weaveDefault_timeout !== undefined) {
      weaveSessionAccess.NORMAL_DEADLINE = weaveSessionAccess.numericValue(weaveDefault_timeout, weaveSessionAccess.NORMAL_DEADLINE);
      weaveChanges.push('default_timeout');
    }
    if (weaveLong_timeout !== undefined) {
      weaveSessionAccess.EXTENDED_DEADLINE = weaveSessionAccess.numericValue(weaveLong_timeout, weaveSessionAccess.EXTENDED_DEADLINE);
      weaveChanges.push('long_timeout');
    }
    return {
      updated: weaveChanges.length > 0,
      changes: weaveChanges,
      current: {
        fast: weaveSessionAccess.QUICK_DEADLINE,
        default: weaveSessionAccess.NORMAL_DEADLINE,
        long: weaveSessionAccess.EXTENDED_DEADLINE
      }
    };
  },
  async reconnect() {
    weaveSessionAccess.detachSession();
    const weaveSuccess = await weaveSessionAccess.attachSession();
    return {
      reconnected: weaveSuccess,
      tabCount: weaveSessionAccess.openDocuments().length
    };
  },
  async cleanup() {
    const weaveBefore = {
      consoleLogs: weaveSessionAccess.consoleLength,
      requestStats: weaveSessionAccess.invocationTotals.callCount
    };
    weaveSessionAccess.resetConsoleEvents();
    weaveSessionAccess.invocationTotals.callCount = 0;
    weaveSessionAccess.invocationTotals.completedCount = 0;
    weaveSessionAccess.invocationTotals.failedCount = 0;
    weaveSessionAccess.invocationTotals.elapsedTotal = 0;
    weaveSessionAccess.invocationTotals.perAction.clear();
    if (global.gc) {
      try {
        global.gc();
      } catch (weaveE) {}
    }
    return {
      cleaned: true,
      before: weaveBefore,
      after: {
        consoleLogs: weaveSessionAccess.consoleLength,
        requestStats: weaveSessionAccess.invocationTotals.callCount
      }
    };
  },
  async health_check() {
    let weaveBrowserOk = false;
    try {
      weaveBrowserOk = !!weaveSessionAccess.browserLink && weaveSessionAccess.browserLink.isConnected();
    } catch (weaveE) {}
    const weavePageOk = !!weaveSessionAccess.currentDocument && !weaveSessionAccess.currentDocument.isClosed();
    return {
      browser: weaveBrowserOk,
      page: weavePageOk,
      tabs: weaveSessionAccess.openDocuments().length,
      healthy: weaveBrowserOk && weavePageOk
    };
  },
  async set_debug({
    enabled: weaveEnabled
  }) {
    weaveSessionAccess.TRACE_ENABLED = !!weaveEnabled;
    return {
      debug: weaveSessionAccess.TRACE_ENABLED
    };
  },
  async request_stats() {
    const weaveToolStats = {};
    for (const [weaveName, weaveStats] of weaveSessionAccess.invocationTotals.perAction) {
      weaveToolStats[weaveName] = {
        count: weaveStats.callCount,
        avgTime: Math.round(weaveStats.elapsedTotal / weaveStats.callCount),
        errors: weaveStats.failedCount
      };
    }
    return {
      total: weaveSessionAccess.invocationTotals.callCount,
      success: weaveSessionAccess.invocationTotals.completedCount,
      errors: weaveSessionAccess.invocationTotals.failedCount,
      avgTime: weaveSessionAccess.invocationTotals.callCount > 0 ? Math.round(weaveSessionAccess.invocationTotals.elapsedTotal / weaveSessionAccess.invocationTotals.callCount) : 0,
      byTool: weaveToolStats
    };
  },
  async console_logs({
    limit: weaveLimit = 50,
    clear: weaveClear = false
  }) {
    const weaveTotal = weaveSessionAccess.consoleLength;
    const weaveLogs = weaveSessionAccess.recentConsoleEvents(weaveSessionAccess.numericValue(weaveLimit, 50));
    if (weaveClear) weaveSessionAccess.resetConsoleEvents();
    return {
      logs: weaveLogs,
      total: weaveTotal
    };
  }
});
