module.exports = weaveSessionAccess => ({
  async navigate({
    url: weaveUrl,
    wait_until: weaveWait_until = 'load',
    timeout: weaveTimeout
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    weaveSessionAccess.surfaceStack = [];
    await weaveP.goto(weaveUrl, {
      waitUntil: weaveWait_until,
      timeout: weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.EXTENDED_DEADLINE)
    });
    const weaveFinalUrl = weaveSessionAccess.documentAddress(weaveP);
    const weaveTitle = await weaveSessionAccess.documentTitle(weaveP);
    let weaveHasDialog = false;
    try {
      weaveHasDialog = await weaveP.locator('[role="dialog"], [class*="modal"], [class*="dialog"], [class*="popup"]').first().isVisible({
        timeout: 300
      });
    } catch {}
    return {
      navigated: weaveUrl,
      finalUrl: weaveFinalUrl,
      title: weaveTitle,
      redirected: weaveFinalUrl !== weaveUrl,
      hasDialog: weaveHasDialog,
      inFrame: false
    };
  },
  async reload({
    timeout: weaveTimeout
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    weaveSessionAccess.surfaceStack = [];
    await weaveP.reload({
      timeout: weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.EXTENDED_DEADLINE)
    });
    return {
      reloaded: true,
      url: weaveSessionAccess.documentAddress(weaveP)
    };
  },
  async go_back() {
    const weaveP = weaveSessionAccess.requireDocument();
    weaveSessionAccess.surfaceStack = [];
    await weaveP.goBack();
    return {
      url: weaveSessionAccess.documentAddress(weaveP)
    };
  },
  async go_forward() {
    const weaveP = weaveSessionAccess.requireDocument();
    weaveSessionAccess.surfaceStack = [];
    await weaveP.goForward();
    return {
      url: weaveSessionAccess.documentAddress(weaveP)
    };
  },
  async stop_loading() {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    await weaveCtx.evaluate(() => window.stop());
    return {
      stopped: true
    };
  },
  async new_tab({
    url: weaveUrl
  }) {
    if (!weaveSessionAccess.sessionContext) throw new Error('No browser context');
    const weaveNewPage = await weaveSessionAccess.sessionContext.newPage();
    weaveSessionAccess.documentPool.push(weaveNewPage);
    weaveSessionAccess.currentDocument = weaveNewPage;
    weaveSessionAccess.surfaceStack = [];
    weaveSessionAccess.observeConsole(weaveNewPage);
    weaveSessionAccess.observeClosure(weaveNewPage);
    if (weaveUrl) await weaveNewPage.goto(weaveUrl, {
      timeout: weaveSessionAccess.EXTENDED_DEADLINE
    });
    const weaveValidPages = weaveSessionAccess.openDocuments();
    return {
      created: true,
      index: weaveValidPages.indexOf(weaveNewPage),
      url: weaveSessionAccess.documentAddress(weaveNewPage)
    };
  },
  async switch_tab({
    index: weaveIndex
  }) {
    const weaveValidPages = weaveSessionAccess.openDocuments();
    const weaveIdx = weaveSessionAccess.numericValue(weaveIndex, 0);
    if (weaveIdx < 0 || weaveIdx >= weaveValidPages.length) throw new Error(`Invalid index: ${weaveIdx}`);
    weaveSessionAccess.currentDocument = weaveValidPages[weaveIdx];
    weaveSessionAccess.surfaceStack = [];
    return {
      switched: weaveIdx,
      url: weaveSessionAccess.documentAddress(weaveSessionAccess.currentDocument)
    };
  },
  async close_tab({
    index: weaveIndex
  }) {
    const weaveValidPages = weaveSessionAccess.openDocuments();
    const weaveIdx = weaveIndex !== undefined ? weaveSessionAccess.numericValue(weaveIndex, weaveValidPages.length - 1) : weaveValidPages.length - 1;
    if (weaveIdx < 0 || weaveIdx >= weaveValidPages.length) throw new Error(`Invalid index: ${weaveIdx}`);
    const weaveTargetPage = weaveValidPages[weaveIdx];
    await weaveTargetPage.close();
    return {
      closed: weaveIdx,
      remaining: weaveSessionAccess.openDocuments().length
    };
  },
  async list_tabs() {
    const weaveValidPages = weaveSessionAccess.openDocuments();
    const weaveTabs = await Promise.all(weaveValidPages.map(async (weaveP, weaveI) => ({
      index: weaveI,
      url: weaveSessionAccess.documentAddress(weaveP),
      title: await weaveSessionAccess.documentTitle(weaveP),
      active: weaveP === weaveSessionAccess.currentDocument
    })));
    return {
      tabs: weaveTabs,
      count: weaveTabs.length
    };
  },
  async enter_frame({
    selector: weaveSelector,
    timeout: weaveTimeout
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    const weaveFrameElement = await weaveLocator.elementHandle({
      timeout: weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.NORMAL_DEADLINE)
    });
    if (!weaveFrameElement) throw new Error('iframe element not found');
    const weaveFrame = await weaveFrameElement.contentFrame();
    if (!weaveFrame) throw new Error('Unable to enter iframe');
    weaveSessionAccess.surfaceStack.push(weaveFrame);
    return {
      entered: weaveSelector,
      depth: weaveSessionAccess.surfaceStack.length
    };
  },
  async exit_frame() {
    if (weaveSessionAccess.surfaceStack.length === 0) return {
      exited: false,
      reason: 'Not in iframe'
    };
    weaveSessionAccess.surfaceStack.pop();
    return {
      exited: true,
      depth: weaveSessionAccess.surfaceStack.length
    };
  },
  async exit_all_frames() {
    const weaveDepth = weaveSessionAccess.surfaceStack.length;
    weaveSessionAccess.surfaceStack = [];
    return {
      exited: weaveDepth
    };
  },
  async list_frames() {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveFrames = weaveP.frames().map((weaveF, weaveI) => ({
      index: weaveI,
      url: weaveF.url(),
      name: weaveF.name()
    }));
    return {
      frames: weaveFrames,
      current_depth: weaveSessionAccess.surfaceStack.length
    };
  }
});
