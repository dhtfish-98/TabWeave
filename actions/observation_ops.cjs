module.exports = weaveSessionAccess => ({
  async wait({
    ms: weaveMs,
    type: weaveType,
    selector: weaveSelector,
    text: weaveText,
    pattern: weavePattern,
    expression: weaveExpression,
    state: weaveState = 'visible',
    timeout: weaveTimeout
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.NORMAL_DEADLINE);
    if (weaveMs !== undefined) {
      await weaveSessionAccess.pauseFor(weaveSessionAccess.numericValue(weaveMs, 1000));
      return {
        waited: weaveMs
      };
    }
    if (!weaveType) weaveType = weaveSelector ? 'element' : weaveText ? 'text' : 'time';
    switch (weaveType) {
      case 'element':
        if (!weaveSelector) throw new Error('element type requires selector');
        await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).waitFor({
          state: weaveState,
          timeout: weaveTo
        });
        return {
          found: true,
          selector: weaveSelector
        };
      case 'gone':
      case 'hidden':
        if (!weaveSelector) throw new Error('gone type requires selector');
        await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).waitFor({
          state: 'hidden',
          timeout: weaveTo
        });
        return {
          gone: true,
          selector: weaveSelector
        };
      case 'text':
        if (!weaveText) throw new Error('text type requires text');
        await weaveCtx.getByText(weaveText).first().waitFor({
          timeout: weaveTo
        });
        return {
          found: true,
          text: weaveText
        };
      case 'url':
        if (!weavePattern) throw new Error('url type requires pattern');
        await weaveP.waitForURL(weavePattern.includes('*') ? weavePattern : `**${weavePattern}**`, {
          timeout: weaveTo
        });
        return {
          matched: true,
          url: weaveSessionAccess.documentAddress(weaveP)
        };
      case 'load':
      case 'networkidle':
      case 'domcontentloaded':
        await weaveP.waitForLoadState(weaveType, {
          timeout: weaveTo
        });
        return {
          loaded: weaveType
        };
      case 'network_idle':
        await weaveP.waitForLoadState('networkidle', {
          timeout: weaveTo
        });
        return {
          idle: true
        };
      case 'function':
        if (!weaveExpression) throw new Error('function type requires expression');
        await weaveP.waitForFunction(weaveExpression, {
          timeout: weaveTo
        });
        return {
          condition: true
        };
      case 'time':
        const weaveWaitMs = weaveSessionAccess.numericValue(weaveMs, weaveSessionAccess.numericValue(weaveTimeout, 1000));
        await weaveSessionAccess.pauseFor(weaveWaitMs);
        return {
          waited: weaveWaitMs
        };
      default:
        throw new Error(`Unknown wait type: ${weaveType}`);
    }
  },
  async scroll({
    to: weaveTo,
    text: weaveText,
    position: weavePosition,
    by: weaveBy,
    direction: weaveDirection,
    amount: weaveAmount,
    within: weaveWithin,
    load_more: weaveLoad_more = false,
    max_scrolls: weaveMax_scrolls = 10
  }) {
    const {
      document: weaveP,
      surface: weaveCtx
    } = weaveSessionAccess.locateSurface();
    if (weaveLoad_more) {
      let weaveScrollCount = 0;
      let weaveLastHeight = 0;
      for (let weaveI = 0; weaveI < weaveMax_scrolls; weaveI++) {
        const weaveHeight = await weaveCtx.evaluate(() => document.body.scrollHeight);
        if (weaveHeight === weaveLastHeight) break;
        weaveLastHeight = weaveHeight;
        await weaveCtx.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await weaveSessionAccess.pauseFor(500);
        weaveScrollCount++;
      }
      return {
        scrolls: weaveScrollCount
      };
    }
    if (weaveWithin) {
      const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveWithin);
      const weaveScrollX = weaveBy?.x || 0;
      const weaveScrollY = weaveBy?.y || 0;
      await weaveLocator.evaluate((weaveEl, {
        x: weaveX,
        y: weaveY
      }) => weaveEl.scrollBy(weaveX, weaveY), {
        x: weaveScrollX,
        y: weaveScrollY
      });
      return {
        scrolled: weaveWithin,
        by: {
          x: weaveScrollX,
          y: weaveScrollY
        }
      };
    }
    if (weaveTo === 'top') {
      await weaveCtx.evaluate(() => window.scrollTo(0, 0));
      return {
        scrolled: 'top'
      };
    }
    if (weaveTo === 'bottom') {
      await weaveCtx.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      return {
        scrolled: 'bottom'
      };
    }
    if (weaveTo === 'center') {
      await weaveCtx.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      return {
        scrolled: 'center'
      };
    }
    if (weaveTo && weaveTo !== 'top' && weaveTo !== 'bottom' && weaveTo !== 'center') {
      const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveTo);
      await weaveLocator.scrollIntoViewIfNeeded();
      return {
        scrolled: weaveTo
      };
    }
    if (weaveText) {
      const weaveLocator = weaveCtx.getByText(weaveText).first();
      await weaveLocator.scrollIntoViewIfNeeded();
      return {
        scrolled: weaveText
      };
    }
    if (weavePosition) {
      await weaveCtx.evaluate(({
        x: weaveX,
        y: weaveY
      }) => window.scrollTo(weaveX, weaveY), weavePosition);
      return {
        scrolled: weavePosition
      };
    }
    if (weaveBy) {
      await weaveCtx.evaluate(({
        x: weaveX,
        y: weaveY
      }) => window.scrollBy(weaveX, weaveY), weaveBy);
      return {
        scrolled: weaveBy
      };
    }
    if (weaveDirection) {
      const weaveAmt = weaveSessionAccess.numericValue(weaveAmount, 300);
      let weaveDx = 0,
        weaveDy = 0;
      switch (weaveDirection) {
        case 'up':
          weaveDy = -weaveAmt;
          break;
        case 'down':
          weaveDy = weaveAmt;
          break;
        case 'left':
          weaveDx = -weaveAmt;
          break;
        case 'right':
          weaveDx = weaveAmt;
          break;
      }
      await weaveCtx.evaluate(({
        x: weaveX,
        y: weaveY
      }) => window.scrollBy(weaveX, weaveY), {
        x: weaveDx,
        y: weaveDy
      });
      return {
        scrolled: weaveDirection,
        amount: weaveAmt
      };
    }
    return {
      scrolled: false
    };
  },
  async check({
    selector: weaveSelector,
    state: weaveState = 'exists',
    text: weaveText,
    class_name: weaveClass_name,
    timeout: weaveTimeout
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.QUICK_DEADLINE);
    if (weaveText && !weaveSelector) {
      try {
        const weaveCount = await weaveCtx.getByText(weaveText).count();
        return {
          exists: weaveCount > 0,
          text: weaveText,
          count: weaveCount
        };
      } catch (weaveE) {
        return {
          exists: false,
          text: weaveText
        };
      }
    }
    if (!weaveSelector) throw new Error('requires selector');
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    if (weaveClass_name) {
      const weaveClasses = await weaveLocator.evaluate(weaveEl => weaveEl.className);
      const weaveHasClass = weaveClasses.split(' ').includes(weaveClass_name);
      return {
        has_class: weaveHasClass,
        class_name: weaveClass_name,
        all_classes: weaveClasses
      };
    }
    try {
      switch (weaveState) {
        case 'exists':
          const weaveCount = await weaveLocator.count();
          return {
            exists: weaveCount > 0,
            count: weaveCount
          };
        case 'visible':
          const weaveVisible = await weaveLocator.isVisible();
          return {
            visible: weaveVisible
          };
        case 'hidden':
          const weaveHidden = await weaveLocator.isHidden();
          return {
            hidden: weaveHidden
          };
        case 'enabled':
          const weaveEnabled = await weaveLocator.isEnabled();
          return {
            enabled: weaveEnabled
          };
        case 'disabled':
          const weaveDisabled = await weaveLocator.isDisabled();
          return {
            disabled: weaveDisabled
          };
        case 'checked':
          const weaveChecked = await weaveLocator.isChecked();
          return {
            checked: weaveChecked
          };
        case 'focused':
          const weaveFocused = await weaveLocator.evaluate(weaveEl => weaveEl === document.activeElement);
          return {
            focused: weaveFocused
          };
        case 'editable':
          const weaveEditable = await weaveLocator.isEditable();
          return {
            editable: weaveEditable
          };
        case 'in_viewport':
          const weaveInViewport = await weaveLocator.evaluate(weaveEl => {
            const weaveRect = weaveEl.getBoundingClientRect();
            return weaveRect.top >= 0 && weaveRect.left >= 0 && weaveRect.bottom <= window.innerHeight && weaveRect.right <= window.innerWidth;
          });
          return {
            in_viewport: weaveInViewport
          };
        default:
          throw new Error(`Unknown status: ${weaveState}`);
      }
    } catch (weaveE) {
      return {
        error: weaveE.message,
        exists: false
      };
    }
  },
  async assert({
    type: weaveType,
    selector: weaveSelector,
    text: weaveText,
    pattern: weavePattern,
    expected: weaveExpected,
    operator: weaveOperator = '==',
    state: weaveState,
    timeout: weaveTimeout
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.QUICK_DEADLINE);
    try {
      switch (weaveType) {
        case 'text':
          if (!weaveText) throw new Error('text assertion requires text');
          const weaveTextLocator = weaveCtx.getByText(weaveText).first();
          await weaveTextLocator.waitFor({
            timeout: weaveTo
          });
          return {
            passed: true,
            type: 'text',
            text: weaveText
          };
        case 'visible':
          if (!weaveSelector) throw new Error('visible assertion requires selector');
          await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).waitFor({
            state: 'visible',
            timeout: weaveTo
          });
          return {
            passed: true,
            type: 'visible',
            selector: weaveSelector
          };
        case 'hidden':
          if (!weaveSelector) throw new Error('hidden assertion requires selector');
          await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).waitFor({
            state: 'hidden',
            timeout: weaveTo
          });
          return {
            passed: true,
            type: 'hidden',
            selector: weaveSelector
          };
        case 'url':
          if (!weavePattern) throw new Error('url assertion requires pattern');
          const weaveUrl = weaveSessionAccess.documentAddress(weaveP);
          let weaveMatched = weaveUrl.includes(weavePattern);
          if (!weaveMatched) {
            try {
              weaveMatched = new RegExp(weavePattern).test(weaveUrl);
            } catch (weaveE) {}
          }
          if (!weaveMatched) throw new Error(`URL does not match: ${weaveUrl}`);
          return {
            passed: true,
            type: 'url',
            url: weaveUrl
          };
        case 'count':
          if (!weaveSelector || weaveExpected === undefined) throw new Error('count assertion requires selector and expected');
          const weaveCountLocator = weaveSessionAccess.resolveLocators(weaveCtx, weaveSelector);
          const weaveCount = await weaveCountLocator.count();
          const weaveExp = weaveSessionAccess.numericValue(weaveExpected, 0);
          let weaveCountPassed = false;
          switch (weaveOperator) {
            case '==':
              weaveCountPassed = weaveCount === weaveExp;
              break;
            case '>':
              weaveCountPassed = weaveCount > weaveExp;
              break;
            case '>=':
              weaveCountPassed = weaveCount >= weaveExp;
              break;
            case '<':
              weaveCountPassed = weaveCount < weaveExp;
              break;
            case '<=':
              weaveCountPassed = weaveCount <= weaveExp;
              break;
            case '!=':
              weaveCountPassed = weaveCount !== weaveExp;
              break;
          }
          if (!weaveCountPassed) throw new Error(`The number of elements ${weaveCount} does not meet ${weaveOperator} ${weaveExpected}`);
          return {
            passed: true,
            type: 'count',
            count: weaveCount,
            expected: weaveExpected,
            operator: weaveOperator
          };
        case 'element':
          if (!weaveSelector || !weaveState) throw new Error('element assertion requires selector and state');
          const weaveCheckResult = await weaveSessionAccess.actionTable.check({
            selector: weaveSelector,
            state: weaveState,
            timeout: weaveTo
          });
          const weavePassed = weaveCheckResult[weaveState] === true;
          if (!weavePassed) throw new Error(`Element status ${weaveState} assertion failed`);
          return {
            passed: true,
            type: 'element',
            state: weaveState
          };
        default:
          throw new Error(`Unknown assertion type: ${weaveType}`);
      }
    } catch (weaveE) {
      return {
        passed: false,
        type: weaveType,
        error: weaveE.message
      };
    }
  },
  async get({
    type: weaveType,
    selector: weaveSelector,
    attribute: weaveAttribute,
    properties: weaveProperties,
    outer: weaveOuter = false,
    fallback: weaveFallback
  }) {
    const {
      surface: weaveCtx
    } = weaveSessionAccess.locateSurface();
    if (!weaveSelector) throw new Error('requires selector');
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    switch (weaveType) {
      case 'text':
        try {
          const weaveText = await weaveLocator.textContent({
            timeout: weaveSessionAccess.QUICK_DEADLINE
          });
          return {
            text: weaveText || weaveFallback || ''
          };
        } catch (weaveE) {
          return {
            text: weaveFallback || '',
            error: weaveE.message
          };
        }
      case 'html':
        const weaveHtml = weaveOuter ? await weaveLocator.evaluate(weaveEl => weaveEl.outerHTML) : await weaveLocator.evaluate(weaveEl => weaveEl.innerHTML);
        return {
          html: weaveHtml
        };
      case 'attribute':
        if (!weaveAttribute) throw new Error('attribute required');
        const weaveValue = await weaveLocator.getAttribute(weaveAttribute);
        return {
          [weaveAttribute]: weaveValue
        };
      case 'value':
        const weaveInputValue = await weaveLocator.inputValue();
        return {
          value: weaveInputValue
        };
      case 'position':
      case 'dimensions':
      case 'bounding_box':
        const weaveBox = await weaveLocator.boundingBox();
        return weaveBox || {
          error: 'Unable to get bounds'
        };
      case 'styles':
        const weaveStyles = await weaveLocator.evaluate((weaveEl, weaveProps) => {
          const weaveComputed = window.getComputedStyle(weaveEl);
          if (weaveProps && weaveProps.length) {
            const weaveResult = {};
            weaveProps.forEach(weaveP => weaveResult[weaveP] = weaveComputed.getPropertyValue(weaveP));
            return weaveResult;
          }
          return {
            display: weaveComputed.display,
            color: weaveComputed.color,
            backgroundColor: weaveComputed.backgroundColor
          };
        }, weaveProperties || []);
        return {
          styles: weaveStyles
        };
      case 'count':
        const weaveCountAll = await weaveSessionAccess.resolveLocators(weaveCtx, weaveSelector).count();
        return {
          count: weaveCountAll
        };
      case 'classes':
        const weaveClasses = await weaveLocator.evaluate(weaveEl => weaveEl.className.split(' ').filter(weaveC => weaveC));
        return {
          classes: weaveClasses
        };
      case 'tag':
        const weaveTag = await weaveLocator.evaluate(weaveEl => weaveEl.tagName.toLowerCase());
        return {
          tag: weaveTag
        };
      case 'dataset':
        const weaveDataset = await weaveLocator.evaluate(weaveEl => ({
          ...weaveEl.dataset
        }));
        return {
          dataset: weaveDataset
        };
      default:
        const weaveInfo = await weaveLocator.evaluate(weaveEl => ({
          tag: weaveEl.tagName.toLowerCase(),
          id: weaveEl.id,
          classes: weaveEl.className,
          text: weaveEl.textContent?.slice(0, 200),
          value: weaveEl.value,
          href: weaveEl.href,
          src: weaveEl.src
        }));
        return weaveInfo;
    }
  },
  async get_page({
    type: weaveType
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveType) {
      return {
        url: weaveSessionAccess.documentAddress(weaveP),
        title: await weaveSessionAccess.documentTitle(weaveP),
        viewport: weaveP.viewportSize(),
        inFrame: weaveSessionAccess.withinFrame()
      };
    }
    switch (weaveType) {
      case 'url':
        return {
          url: weaveSessionAccess.documentAddress(weaveP)
        };
      case 'title':
        return {
          title: await weaveSessionAccess.documentTitle(weaveP)
        };
      case 'source':
        const weaveSource = await weaveCtx.content();
        return {
          source: weaveSource.slice(0, 50000)
        };
      case 'text':
        const weaveText = await weaveCtx.evaluate(() => document.body.innerText);
        return {
          text: weaveText.slice(0, 20000)
        };
      case 'viewport':
        return {
          viewport: weaveP.viewportSize()
        };
      default:
        throw new Error(`Unknown type: ${weaveType}`);
    }
  },
  async screenshot({
    path: weaveSavePath,
    fullPage: weaveFullPage = false,
    selector: weaveSelector
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveOptions = {
      fullPage: weaveFullPage
    };
    if (weaveSavePath) {
      const weaveValidation = weaveSessionAccess.approveLocation(weaveSavePath);
      if (!weaveValidation.valid) throw new Error(weaveValidation.error);
      weaveOptions.path = weaveValidation.path;
    }
    let weaveBuffer;
    if (weaveSelector) {
      const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
      weaveBuffer = await weaveLocator.screenshot(weaveOptions);
    } else {
      weaveBuffer = await weaveP.screenshot(weaveOptions);
    }
    if (!weaveSavePath) {
      const weaveBase64 = weaveBuffer.toString('base64');
      return {
        screenshot: weaveBase64,
        size: weaveBuffer.length
      };
    }
    return {
      saved: weaveOptions.path,
      size: weaveBuffer.length
    };
  },
  async eval({
    script: weaveScript,
    timeout: weaveTimeout
  }) {
    const {
      surface: weaveCtx
    } = weaveSessionAccess.locateSurface();
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.EXTENDED_DEADLINE);
    let weaveTimer;
    try {
      const weaveResult = await Promise.race([weaveCtx.evaluate(weaveScript), new Promise((weave, weaveReject) => {
        weaveTimer = setTimeout(() => weaveReject(new Error(`eval timeout (${weaveTo}ms)`)), weaveTo);
      })]);
      return {
        result: weaveSessionAccess.encodeValue(weaveResult)
      };
    } finally {
      clearTimeout(weaveTimer);
    }
  },
  async find({
    selector: weaveSelector,
    text: weaveText,
    attribute: weaveAttribute,
    value: weaveValue,
    tag: weaveTag,
    limit: weaveLimit = 10
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    const weaveMax = weaveSessionAccess.numericValue(weaveLimit, 10);
    let weaveLocator;
    if (weaveText) {
      weaveLocator = weaveTag ? weaveCtx.locator(weaveTag).filter({
        hasText: weaveText
      }) : weaveCtx.getByText(weaveText);
    } else if (weaveAttribute) {
      const weaveEscapedValue = weaveValue ? weaveValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : '';
      const weaveAttrSelector = weaveValue ? `${weaveTag || '*'}[${weaveAttribute}="${weaveEscapedValue}"]` : `${weaveTag || '*'}[${weaveAttribute}]`;
      weaveLocator = weaveCtx.locator(weaveAttrSelector);
    } else if (weaveSelector) {
      weaveLocator = weaveCtx.locator(weaveSelector);
    } else {
      throw new Error('requires selector, text or attribute');
    }
    const weaveTotal = await weaveLocator.count();
    const weaveElements = await weaveLocator.evaluateAll((weaveEls, weaveMaxCount) => weaveEls.slice(0, weaveMaxCount).map((weaveEl, weaveI) => ({
      index: weaveI,
      tag: weaveEl.tagName.toLowerCase(),
      text: (weaveEl.textContent || '').slice(0, 100),
      id: weaveEl.id || '',
      class: weaveEl.className || ''
    })), weaveMax);
    return {
      found: weaveElements.length,
      total: weaveTotal,
      elements: weaveElements
    };
  },
  async highlight({
    selector: weaveSelector,
    duration: weaveDuration = 2000,
    color: weaveColor = 'red'
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    const weaveSafeColor = String(weaveColor).replace(/[^a-zA-Z0-9#(),.\s%]/g, '');
    await weaveLocator.evaluate((weaveEl, {
      c: weaveC,
      d: weaveD
    }) => {
      const weaveOrig = weaveEl.style.outline;
      weaveEl.style.outline = `3px solid ${weaveC}`;
      setTimeout(() => weaveEl.style.outline = weaveOrig, weaveD);
    }, {
      c: weaveSafeColor,
      d: weaveDuration
    });
    return {
      highlighted: weaveSelector
    };
  },
  async snapshot() {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveTree = await weaveP.locator('body').ariaSnapshot();
    return {
      snapshot: weaveTree,
      format: 'aria-yaml'
    };
  },
  async count({
    selector: weaveSelector
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveC = await weaveCtx.locator(weaveSelector).count();
    return {
      count: weaveC
    };
  }
});
