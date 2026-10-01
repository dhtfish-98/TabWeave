module.exports = weaveSessionAccess => ({
  async cookies({
    action: weaveAction = 'get',
    name: weaveName,
    value: weaveValue,
    domain: weaveDomain,
    path: weaveCookiePath,
    expires: weaveExpires,
    httpOnly: weaveHttpOnly,
    secure: weaveSecure
  }) {
    const weaveCtx = weaveSessionAccess.sessionContext;
    if (!weaveCtx) throw new Error('No browser context');
    switch (weaveAction) {
      case 'get':
        const weaveCookies = await weaveCtx.cookies();
        if (weaveName) {
          const weaveFiltered = weaveCookies.filter(weaveC => weaveC.name === weaveName);
          return {
            cookies: weaveFiltered
          };
        }
        return {
          cookies: weaveCookies
        };
      case 'set':
        if (!weaveName || !weaveValue || !weaveDomain) throw new Error('set requires name, value, domain');
        const weaveCookie = {
          name: weaveName,
          value: weaveValue,
          domain: weaveDomain,
          path: weaveCookiePath || '/'
        };
        if (weaveExpires) weaveCookie.expires = weaveExpires;
        if (weaveHttpOnly !== undefined) weaveCookie.httpOnly = weaveHttpOnly;
        if (weaveSecure !== undefined) weaveCookie.secure = weaveSecure;
        await weaveCtx.addCookies([weaveCookie]);
        return {
          set: weaveName
        };
      case 'delete':
        if (!weaveName) throw new Error('delete requires name');
        await weaveCtx.clearCookies({
          name: weaveName,
          domain: weaveDomain,
          path: weaveCookiePath
        });
        return {
          deleted: weaveName
        };
      case 'clear':
        await weaveCtx.clearCookies();
        return {
          cleared: true
        };
      default:
        throw new Error(`Unknown operation: ${weaveAction}`);
    }
  },
  async storage({
    action: weaveAction = 'get',
    type: weaveType = 'local',
    key: weaveKey,
    value: weaveValue
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    const weaveStorageType = weaveType === 'session' ? 'sessionStorage' : 'localStorage';
    switch (weaveAction) {
      case 'get':
        if (weaveKey) {
          const weaveVal = await weaveCtx.evaluate(({
            st: weaveSt,
            k: weaveK
          }) => window[weaveSt].getItem(weaveK), {
            st: weaveStorageType,
            k: weaveKey
          });
          return {
            [weaveKey]: weaveVal
          };
        } else {
          const weaveAll = await weaveCtx.evaluate(weaveSt => {
            const weaveResult = {};
            for (let weaveI = 0; weaveI < window[weaveSt].length; weaveI++) {
              const weaveK = window[weaveSt].key(weaveI);
              weaveResult[weaveK] = window[weaveSt].getItem(weaveK);
            }
            return weaveResult;
          }, weaveStorageType);
          return {
            storage: weaveAll
          };
        }
      case 'set':
        if (!weaveKey) throw new Error('set requires key');
        await weaveCtx.evaluate(({
          st: weaveSt,
          k: weaveK,
          v: weaveV
        }) => window[weaveSt].setItem(weaveK, weaveV || ''), {
          st: weaveStorageType,
          k: weaveKey,
          v: weaveValue
        });
        return {
          set: weaveKey
        };
      case 'remove':
        if (!weaveKey) throw new Error('remove requires key');
        await weaveCtx.evaluate(({
          st: weaveSt,
          k: weaveK
        }) => window[weaveSt].removeItem(weaveK), {
          st: weaveStorageType,
          k: weaveKey
        });
        return {
          removed: weaveKey
        };
      case 'clear':
        await weaveCtx.evaluate(weaveSt => window[weaveSt].clear(), weaveStorageType);
        return {
          cleared: weaveType
        };
      default:
        throw new Error(`Unknown operation: ${weaveAction}`);
    }
  },
  async get_text({
    selector: weaveSelector,
    fallback: weaveFallback
  }) {
    return weaveSessionAccess.actionTable.get({
      type: 'text',
      selector: weaveSelector,
      fallback: weaveFallback
    });
  },
  async get_html({
    selector: weaveSelector,
    outer: weaveOuter
  }) {
    return weaveSessionAccess.actionTable.get({
      type: 'html',
      selector: weaveSelector,
      outer: weaveOuter
    });
  },
  async get_attribute({
    selector: weaveSelector,
    attribute: weaveAttribute
  }) {
    return weaveSessionAccess.actionTable.get({
      type: 'attribute',
      selector: weaveSelector,
      attribute: weaveAttribute
    });
  },
  async get_url() {
    return weaveSessionAccess.actionTable.get_page({
      type: 'url'
    });
  },
  async get_title() {
    return weaveSessionAccess.actionTable.get_page({
      type: 'title'
    });
  },
  async exists({
    selector: weaveSelector,
    timeout: weaveTimeout
  }) {
    return weaveSessionAccess.actionTable.check({
      selector: weaveSelector,
      state: 'exists',
      timeout: weaveTimeout
    });
  },
  async is_visible({
    selector: weaveSelector
  }) {
    return weaveSessionAccess.actionTable.check({
      selector: weaveSelector,
      state: 'visible'
    });
  },
  async wait_for({
    selector: weaveSelector,
    state: weaveState,
    timeout: weaveTimeout
  }) {
    return weaveSessionAccess.actionTable.wait({
      type: 'element',
      selector: weaveSelector,
      state: weaveState,
      timeout: weaveTimeout
    });
  },
  async wait_for_text({
    text: weaveText,
    timeout: weaveTimeout
  }) {
    return weaveSessionAccess.actionTable.wait({
      type: 'text',
      text: weaveText,
      timeout: weaveTimeout
    });
  },
  async get_cookies() {
    return weaveSessionAccess.actionTable.cookies({
      action: 'get'
    });
  },
  async set_cookie(weaveOpts) {
    return weaveSessionAccess.actionTable.cookies({
      action: 'set',
      ...weaveOpts
    });
  },
  async clear_cookies() {
    return weaveSessionAccess.actionTable.cookies({
      action: 'clear'
    });
  },
  async get_storage({
    key: weaveKey,
    type: weaveType
  }) {
    return weaveSessionAccess.actionTable.storage({
      action: 'get',
      key: weaveKey,
      type: weaveType
    });
  },
  async set_storage({
    key: weaveKey,
    value: weaveValue,
    type: weaveType
  }) {
    return weaveSessionAccess.actionTable.storage({
      action: 'set',
      key: weaveKey,
      value: weaveValue,
      type: weaveType
    });
  },
  async clear_storage({
    type: weaveType
  }) {
    return weaveSessionAccess.actionTable.storage({
      action: 'clear',
      type: weaveType
    });
  },
  async move_mouse({
    x: weaveX,
    y: weaveY,
    steps: weaveSteps
  }) {
    return weaveSessionAccess.actionTable.mouse({
      action: 'move',
      x: weaveX,
      y: weaveY,
      steps: weaveSteps
    });
  },
  async mouse_down({
    button: weaveButton
  }) {
    return weaveSessionAccess.actionTable.mouse({
      action: 'down',
      button: weaveButton
    });
  },
  async mouse_up({
    button: weaveButton
  }) {
    return weaveSessionAccess.actionTable.mouse({
      action: 'up',
      button: weaveButton
    });
  },
  async select_option({
    selector: weaveSelector,
    value: weaveValue
  }) {
    return weaveSessionAccess.actionTable.select({
      selector: weaveSelector,
      value: weaveValue
    });
  },
  async set_checked({
    selector: weaveSelector,
    checked: weaveChecked
  }) {
    return weaveSessionAccess.actionTable.checkbox({
      selector: weaveSelector,
      checked: weaveChecked
    });
  },
  async toggle_checkbox({
    selector: weaveSelector
  }) {
    return weaveSessionAccess.actionTable.checkbox({
      selector: weaveSelector
    });
  }
});
