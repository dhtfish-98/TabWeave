module.exports = weaveSessionAccess => ({
  async click({
    selector: weaveSelector,
    text: weaveText,
    x: weaveX,
    y: weaveY,
    mode: weaveMode = 'fast',
    type: weaveType = 'single',
    index: weaveIndex,
    if_exists: weaveIf_exists = false,
    wait_after: weaveWait_after,
    scroll_first: weaveScroll_first = false,
    hover_first: weaveHover_first,
    timeout: weaveTimeout,
    duration: weaveDuration
  }) {
    const {
      document: weaveP,
      surface: weaveCtx
    } = weaveSessionAccess.locateSurface();
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.QUICK_DEADLINE);
    let weaveLocator;
    let weaveClickType = 'selector';
    if (weaveX !== undefined && weaveY !== undefined) {
      weaveClickType = 'coordinate';
    } else if (weaveText) {
      weaveLocator = weaveCtx.getByText(weaveText, {
        exact: false
      });
      if (weaveIndex !== undefined) {
        weaveLocator = weaveLocator.nth(weaveSessionAccess.numericValue(weaveIndex, 0));
      } else {
        weaveLocator = weaveLocator.first();
      }
      weaveClickType = 'text';
    } else if (weaveSelector) {
      if (weaveIndex !== undefined) {
        if (weaveSelector.startsWith('text=')) {
          weaveLocator = weaveCtx.getByText(weaveSelector.slice(5), {
            exact: false
          }).nth(weaveSessionAccess.numericValue(weaveIndex, 0));
        } else if (weaveSelector.startsWith('role=')) {
          const weaveParts = weaveSelector.slice(5).split('[');
          const weaveRole = weaveParts[0].trim();
          weaveLocator = weaveCtx.getByRole(weaveRole).nth(weaveSessionAccess.numericValue(weaveIndex, 0));
        } else if (weaveSelector.startsWith('placeholder=')) {
          weaveLocator = weaveCtx.getByPlaceholder(weaveSelector.slice(12)).nth(weaveSessionAccess.numericValue(weaveIndex, 0));
        } else if (weaveSelector.startsWith('label=')) {
          weaveLocator = weaveCtx.getByLabel(weaveSelector.slice(6)).nth(weaveSessionAccess.numericValue(weaveIndex, 0));
        } else {
          weaveLocator = weaveCtx.locator(weaveSelector).nth(weaveSessionAccess.numericValue(weaveIndex, 0));
        }
      } else {
        weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
      }
    } else {
      throw new Error('selector, text or coordinates must be provided');
    }
    if (weaveIf_exists && weaveClickType !== 'coordinate') {
      try {
        const weaveCount = await weaveLocator.count();
        if (weaveCount === 0) return {
          clicked: false,
          reason: 'Element does not exist'
        };
      } catch (weaveE) {
        return {
          clicked: false,
          reason: weaveE.message
        };
      }
    }
    if (weaveHover_first) {
      const weaveHoverLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveHover_first);
      await weaveHoverLocator.hover({
        timeout: weaveTo
      });
      await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(100, 300));
    }
    if (weaveScroll_first && weaveClickType !== 'coordinate') {
      await weaveLocator.scrollIntoViewIfNeeded({
        timeout: weaveTo
      });
    }
    if (weaveClickType === 'coordinate') {
      const weaveCx = weaveSessionAccess.numericValue(weaveX, 0);
      const weaveCy = weaveSessionAccess.numericValue(weaveY, 0);
      const weaveButton = weaveType === 'right' ? 'right' : 'left';
      if (weaveType === 'double') {
        await weaveP.mouse.dblclick(weaveCx, weaveCy, {
          button: weaveButton
        });
      } else if (weaveType === 'triple') {
        await weaveP.mouse.click(weaveCx, weaveCy, {
          button: weaveButton,
          clickCount: 3
        });
      } else if (weaveType === 'long') {
        await weaveP.mouse.move(weaveCx, weaveCy);
        await weaveP.mouse.down({
          button: weaveButton
        });
        await weaveSessionAccess.pauseFor(weaveSessionAccess.numericValue(weaveDuration, 500));
        await weaveP.mouse.up({
          button: weaveButton
        });
      } else {
        await weaveP.mouse.click(weaveCx, weaveCy, {
          button: weaveButton
        });
      }
    } else if (weaveMode === 'smart') {
      const weaveBox = await weaveLocator.boundingBox();
      if (!weaveBox) throw new Error('Unable to obtain element position');
      const weaveTargetX = weaveBox.x + weaveBox.width / 2 + weaveSessionAccess.sampleInteger(-3, 3);
      const weaveTargetY = weaveBox.y + weaveBox.height / 2 + weaveSessionAccess.sampleInteger(-2, 2);
      await weaveP.mouse.move(weaveTargetX, weaveTargetY, {
        steps: weaveSessionAccess.sampleInteger(2, 5)
      });
      await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(10, 40));
      if (weaveType === 'double') {
        await weaveP.mouse.dblclick(weaveTargetX, weaveTargetY);
      } else if (weaveType === 'triple') {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY, {
          clickCount: 3
        });
      } else if (weaveType === 'right') {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY, {
          button: 'right'
        });
      } else if (weaveType === 'long') {
        await weaveP.mouse.down();
        await weaveSessionAccess.pauseFor(weaveSessionAccess.numericValue(weaveDuration, 500));
        await weaveP.mouse.up();
      } else {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY);
      }
    } else if (weaveMode === 'human') {
      const weaveBox = await weaveLocator.boundingBox();
      if (!weaveBox) throw new Error('Unable to obtain element position');
      const weaveTargetX = weaveBox.x + weaveBox.width / 2 + weaveSessionAccess.sampleInteger(-5, 5);
      const weaveTargetY = weaveBox.y + weaveBox.height / 2 + weaveSessionAccess.sampleInteger(-3, 3);
      const weaveStartX = weaveSessionAccess.sampleInteger(100, 300);
      const weaveStartY = weaveSessionAccess.sampleInteger(100, 300);
      await weaveP.mouse.move(weaveStartX, weaveStartY);
      const weavePathPoints = weaveSessionAccess.pointerTrajectory(weaveStartX, weaveStartY, weaveTargetX, weaveTargetY);
      for (const weavePoint of weavePathPoints) {
        await weaveP.mouse.move(weavePoint.x, weavePoint.y);
        await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(5, 15));
      }
      await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 150));
      if (weaveType === 'double') {
        await weaveP.mouse.dblclick(weaveTargetX, weaveTargetY);
      } else if (weaveType === 'triple') {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY, {
          clickCount: 3
        });
      } else if (weaveType === 'right') {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY, {
          button: 'right'
        });
      } else if (weaveType === 'long') {
        await weaveP.mouse.down();
        await weaveSessionAccess.pauseFor(weaveSessionAccess.numericValue(weaveDuration, 500));
        await weaveP.mouse.up();
      } else {
        await weaveP.mouse.click(weaveTargetX, weaveTargetY);
      }
    } else {
      const weaveClickOptions = {
        timeout: weaveTo
      };
      if (weaveType === 'right') weaveClickOptions.button = 'right';
      if (weaveType === 'triple') weaveClickOptions.clickCount = 3;
      if (weaveType === 'long') {
        const weaveBox = await weaveLocator.boundingBox();
        if (!weaveBox) throw new Error('Unable to obtain element position');
        const weaveCx = weaveBox.x + weaveBox.width / 2;
        const weaveCy = weaveBox.y + weaveBox.height / 2;
        await weaveP.mouse.move(weaveCx, weaveCy);
        await weaveP.mouse.down();
        await weaveSessionAccess.pauseFor(weaveSessionAccess.numericValue(weaveDuration, 500));
        await weaveP.mouse.up();
      } else if (weaveType === 'double') {
        await weaveLocator.dblclick(weaveClickOptions);
      } else {
        await weaveLocator.click(weaveClickOptions);
      }
    }
    if (weaveWait_after) {
      await weaveP.waitForLoadState(weaveWait_after, {
        timeout: weaveSessionAccess.EXTENDED_DEADLINE
      });
    }
    const weaveResult = {
      clicked: true,
      mode: weaveMode,
      type: weaveType,
      inFrame: weaveSessionAccess.withinFrame()
    };
    try {
      const weaveAfterUrl = weaveSessionAccess.documentAddress(weaveP);
      weaveResult.url = weaveAfterUrl;
      weaveResult.title = await weaveSessionAccess.documentTitle(weaveP);
      if (weaveLocator) {
        try {
          weaveResult.elementText = (await weaveLocator.textContent({
            timeout: 500
          }))?.trim().slice(0, 100) || '';
        } catch {}
      }
    } catch {}
    return weaveResult;
  },
  async type({
    selector: weaveSelector,
    label: weaveLabel,
    placeholder: weavePlaceholder,
    index: weaveIndex,
    text: weaveText,
    mode: weaveMode = 'fast',
    clear: weaveClear = true,
    press_enter: weavePress_enter = false,
    if_exists: weaveIf_exists = false,
    delay: weaveDelay,
    timeout: weaveTimeout
  }) {
    const {
      document: weaveP,
      surface: weaveCtx
    } = weaveSessionAccess.locateSurface();
    if (weaveText === undefined || weaveText === null) weaveText = '';
    const weaveTextStr = String(weaveText);
    const weaveTo = weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.QUICK_DEADLINE);
    let weaveLocator;
    if (weaveLabel) {
      weaveLocator = weaveCtx.getByLabel(weaveLabel).first();
    } else if (weavePlaceholder) {
      weaveLocator = weaveCtx.getByPlaceholder(weavePlaceholder).first();
    } else if (weaveIndex !== undefined) {
      weaveLocator = weaveCtx.locator('input:visible, textarea:visible').nth(weaveSessionAccess.numericValue(weaveIndex, 0));
    } else if (weaveSelector) {
      weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    } else {
      throw new Error('selector, label, placeholder or index must be provided');
    }
    if (weaveIf_exists) {
      try {
        const weaveCount = await weaveLocator.count();
        if (weaveCount === 0) return {
          typed: false,
          reason: 'Element does not exist'
        };
      } catch (weaveE) {
        return {
          typed: false,
          reason: weaveE.message
        };
      }
    }
    const weaveIsSafeForKeyboard = weaveCh => /^[a-zA-Z0-9 ]$/.test(weaveCh);
    if (weaveMode === 'human') {
      await weaveLocator.click({
        timeout: weaveTo
      });
      if (weaveClear) {
        await weaveP.keyboard.press(weaveSessionAccess.SELECT_EVERYTHING);
        await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(30, 80));
      }
      for (let weaveI = 0; weaveI < weaveTextStr.length; weaveI++) {
        const weaveCh = weaveTextStr[weaveI];
        if (weaveIsSafeForKeyboard(weaveCh) && Math.random() < 0.03 && weaveI > 0) {
          const weaveWrongChar = String.fromCharCode(weaveCh.charCodeAt(0) + weaveSessionAccess.sampleInteger(-1, 1));
          await weaveP.keyboard.insertText(weaveWrongChar);
          await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(100, 200));
          await weaveP.keyboard.press('Backspace');
          await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 100));
        }
        await weaveP.keyboard.insertText(weaveCh);
        await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 150));
        if (Math.random() < 0.1) await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(100, 300));
      }
    } else if (weaveMode === 'slow') {
      const weaveMinDelay = weaveSessionAccess.numericValue(weaveDelay, 50);
      const weaveMaxDelay = weaveMinDelay * 3;
      await weaveLocator.click({
        timeout: weaveTo
      });
      if (weaveClear) {
        await weaveP.keyboard.press(weaveSessionAccess.SELECT_EVERYTHING);
        await weaveSessionAccess.pauseFor(50);
      }
      for (const weaveChar of weaveTextStr) {
        await weaveP.keyboard.insertText(weaveChar);
        await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(weaveMinDelay, weaveMaxDelay));
      }
    } else {
      try {
        if (weaveClear) {
          await weaveLocator.fill(weaveTextStr, {
            timeout: weaveTo
          });
        } else {
          const weaveCurrent = await weaveLocator.inputValue().catch(() => '');
          await weaveLocator.fill(weaveCurrent + weaveTextStr, {
            timeout: weaveTo
          });
        }
      } catch (weaveFillErr) {
        weaveSessionAccess.traceEvent('fill failed, falling back to insertText:', weaveFillErr.message);
        await weaveLocator.click({
          timeout: weaveTo
        });
        if (weaveClear) {
          await weaveP.keyboard.press(weaveSessionAccess.SELECT_EVERYTHING);
        }
        await weaveP.keyboard.insertText(weaveTextStr);
      }
    }
    if (weavePress_enter) {
      await weaveP.keyboard.press('Enter');
    }
    const weaveResult = {
      typed: true,
      length: weaveTextStr.length,
      mode: weaveMode,
      inFrame: weaveSessionAccess.withinFrame()
    };
    try {
      weaveResult.currentValue = await weaveLocator.inputValue({
        timeout: 500
      });
    } catch {
      try {
        weaveResult.currentValue = (await weaveLocator.textContent({
          timeout: 500
        }))?.trim().slice(0, 200) || '';
      } catch {}
    }
    if (weavePress_enter) {
      try {
        weaveResult.url = weaveSessionAccess.documentAddress(weaveP);
        weaveResult.title = await weaveSessionAccess.documentTitle(weaveP);
      } catch {}
    }
    return weaveResult;
  },
  async fill({
    selector: weaveSelector,
    text: weaveText,
    timeout: weaveTimeout
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    if (weaveText === undefined || weaveText === null) weaveText = '';
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    await weaveLocator.fill(String(weaveText), {
      timeout: weaveSessionAccess.numericValue(weaveTimeout, weaveSessionAccess.QUICK_DEADLINE)
    });
    let weaveCurrentValue;
    try {
      weaveCurrentValue = await weaveLocator.inputValue({
        timeout: 500
      });
    } catch {}
    return {
      filled: weaveSelector,
      text: String(weaveText).slice(0, 50),
      currentValue: weaveCurrentValue,
      inFrame: weaveSessionAccess.withinFrame()
    };
  },
  async fill_form({
    fields: weaveFields,
    submit: weaveSubmit = false
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    if (!weaveCtx) throw new Error('No valid context');
    const weaveResults = [];
    for (const [weaveKey, weaveValue] of Object.entries(weaveFields)) {
      try {
        let weaveLocator;
        if (weaveKey.startsWith('#') || weaveKey.startsWith('.') || weaveKey.startsWith('[')) {
          weaveLocator = weaveCtx.locator(weaveKey).first();
        } else {
          weaveLocator = weaveCtx.getByLabel(weaveKey).first();
          const weaveCount = await weaveLocator.count();
          if (weaveCount === 0) weaveLocator = weaveCtx.locator(`[name="${weaveSessionAccess.quoteSelector(weaveKey)}"]`).first();
        }
        await weaveLocator.fill(String(weaveValue), {
          timeout: weaveSessionAccess.QUICK_DEADLINE
        });
        weaveResults.push({
          field: weaveKey,
          success: true
        });
      } catch (weaveE) {
        weaveResults.push({
          field: weaveKey,
          success: false,
          error: weaveE.message
        });
      }
    }
    if (weaveSubmit) {
      try {
        const weaveSubmitBtn = weaveCtx.locator('button[type="submit"], input[type="submit"]').first();
        await weaveSubmitBtn.click({
          timeout: weaveSessionAccess.QUICK_DEADLINE
        });
      } catch (weaveE) {}
    }
    return {
      filled: weaveResults.filter(weaveR => weaveR.success).length,
      total: weaveResults.length,
      results: weaveResults,
      inFrame: weaveSessionAccess.withinFrame()
    };
  },
  async press_key({
    key: weaveKey,
    modifiers: weaveModifiers
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    let weaveKeyCombo = weaveKey;
    if (weaveModifiers && weaveModifiers.length) {
      weaveKeyCombo = [...weaveModifiers, weaveKey].join('+');
    }
    await weaveP.keyboard.press(weaveKeyCombo);
    return {
      pressed: weaveKeyCombo
    };
  },
  async hotkey({
    keys: weaveKeys
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    await weaveP.keyboard.press(weaveKeys);
    return {
      pressed: weaveKeys
    };
  },
  async mouse({
    action: weaveAction,
    x: weaveX,
    y: weaveY,
    button: weaveButton = 'left',
    steps: weaveSteps
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    switch (weaveAction) {
      case 'move':
        await weaveP.mouse.move(weaveSessionAccess.numericValue(weaveX, 0), weaveSessionAccess.numericValue(weaveY, 0), {
          steps: weaveSessionAccess.numericValue(weaveSteps, 1)
        });
        return {
          moved: {
            x: weaveX,
            y: weaveY
          }
        };
      case 'down':
        await weaveP.mouse.down({
          button: weaveButton
        });
        return {
          down: weaveButton
        };
      case 'up':
        await weaveP.mouse.up({
          button: weaveButton
        });
        return {
          up: weaveButton
        };
      case 'click':
        await weaveP.mouse.click(weaveSessionAccess.numericValue(weaveX, 0), weaveSessionAccess.numericValue(weaveY, 0), {
          button: weaveButton
        });
        return {
          clicked: {
            x: weaveX,
            y: weaveY
          }
        };
      default:
        throw new Error(`Unknown mouse action: ${weaveAction}`);
    }
  },
  async hover({
    selector: weaveSelector
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    await weaveLocator.hover({
      timeout: weaveSessionAccess.QUICK_DEADLINE
    });
    return {
      hovered: weaveSelector
    };
  },
  async drag({
    from_selector: weaveFrom_selector,
    to_selector: weaveTo_selector,
    from_x: weaveFrom_x,
    from_y: weaveFrom_y,
    to_x: weaveTo_x,
    to_y: weaveTo_y,
    offset_x: weaveOffset_x,
    offset_y: weaveOffset_y
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    let weaveStartX, weaveStartY, weaveEndX, weaveEndY;
    if (weaveFrom_selector) {
      const weaveFromLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveFrom_selector);
      const weaveFromBox = await weaveFromLocator.boundingBox();
      if (!weaveFromBox) throw new Error('Start element not found');
      weaveStartX = weaveFromBox.x + weaveFromBox.width / 2;
      weaveStartY = weaveFromBox.y + weaveFromBox.height / 2;
    } else {
      weaveStartX = weaveSessionAccess.numericValue(weaveFrom_x, 0);
      weaveStartY = weaveSessionAccess.numericValue(weaveFrom_y, 0);
    }
    if (weaveTo_selector) {
      const weaveToLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveTo_selector);
      const weaveToBox = await weaveToLocator.boundingBox();
      if (!weaveToBox) throw new Error('Target element not found');
      weaveEndX = weaveToBox.x + weaveToBox.width / 2;
      weaveEndY = weaveToBox.y + weaveToBox.height / 2;
    } else if (weaveOffset_x !== undefined || weaveOffset_y !== undefined) {
      weaveEndX = weaveStartX + weaveSessionAccess.numericValue(weaveOffset_x, 0);
      weaveEndY = weaveStartY + weaveSessionAccess.numericValue(weaveOffset_y, 0);
    } else {
      weaveEndX = weaveSessionAccess.numericValue(weaveTo_x, weaveStartX);
      weaveEndY = weaveSessionAccess.numericValue(weaveTo_y, weaveStartY);
    }
    await weaveP.mouse.move(weaveStartX, weaveStartY);
    await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 100));
    await weaveP.mouse.down();
    await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 100));
    const weavePath = weaveSessionAccess.pointerTrajectory(weaveStartX, weaveStartY, weaveEndX, weaveEndY);
    for (const weavePoint of weavePath) {
      await weaveP.mouse.move(weavePoint.x, weavePoint.y);
      await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(10, 25));
    }
    await weaveSessionAccess.pauseFor(weaveSessionAccess.sampleInteger(50, 150));
    await weaveP.mouse.up();
    return {
      dragged: true,
      from: {
        x: weaveStartX,
        y: weaveStartY
      },
      to: {
        x: weaveEndX,
        y: weaveEndY
      }
    };
  },
  async select({
    selector: weaveSelector,
    value: weaveValue,
    index: weaveIndex,
    text: weaveText
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    if (weaveValue !== undefined) {
      await weaveLocator.selectOption({
        value: String(weaveValue)
      });
      return {
        selected: weaveValue
      };
    }
    if (weaveIndex !== undefined) {
      await weaveLocator.selectOption({
        index: weaveSessionAccess.numericValue(weaveIndex, 0)
      });
      return {
        selected: weaveIndex
      };
    }
    if (weaveText !== undefined) {
      await weaveLocator.selectOption({
        label: weaveText
      });
      return {
        selected: weaveText
      };
    }
    throw new Error('requires value, index or text');
  },
  async checkbox({
    selector: weaveSelector,
    checked: weaveChecked
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    if (weaveChecked === undefined) {
      const weaveCurrent = await weaveLocator.isChecked();
      if (weaveCurrent) await weaveLocator.uncheck();else await weaveLocator.check();
      return {
        checked: !weaveCurrent
      };
    } else {
      if (weaveChecked) await weaveLocator.check();else await weaveLocator.uncheck();
      return {
        checked: weaveChecked
      };
    }
  },
  async upload_file({
    selector: weaveSelector,
    files: weaveFiles
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    const weaveLocator = weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector);
    const weaveFileList = Array.isArray(weaveFiles) ? weaveFiles : [weaveFiles];
    const weaveValidatedFiles = weaveFileList.map(weaveF => {
      const weaveValidation = weaveSessionAccess.approveLocation(weaveF);
      if (!weaveValidation.valid) throw new Error(`Invalid file path: ${weaveValidation.error} (${weaveF})`);
      return weaveValidation.path;
    });
    await weaveLocator.setInputFiles(weaveValidatedFiles);
    return {
      uploaded: weaveValidatedFiles.length
    };
  },
  async dialog({
    action: weaveAction = 'accept',
    text: weaveText
  }) {
    const weaveP = weaveSessionAccess.requireDocument();
    weaveP.once('dialog', async weaveDialog => {
      if (weaveAction === 'dismiss') await weaveDialog.dismiss();else await weaveDialog.accept(weaveText);
    });
    return {
      handler: weaveAction
    };
  },
  async focus({
    selector: weaveSelector
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).focus();
    return {
      focused: weaveSelector
    };
  },
  async blur({
    selector: weaveSelector
  }) {
    weaveSessionAccess.requireDocument();
    const weaveCtx = weaveSessionAccess.activeSurface();
    await weaveSessionAccess.resolveLocator(weaveCtx, weaveSelector).evaluate(weaveEl => weaveEl.blur());
    return {
      blurred: weaveSelector
    };
  }
});
