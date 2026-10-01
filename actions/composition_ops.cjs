module.exports = weaveSessionAccess => ({
  async batch({
    actions: weaveActions
  }, weaveDepth = 0) {
    if (weaveDepth > 5) throw new Error('The batch recursion is nested too deeply (maximum 5 levels)');
    const weaveResults = [];
    for (const weaveAction of weaveActions) {
      try {
        if (!weaveAction || typeof weaveAction !== 'object') throw new Error('Each action must be an object');
        weaveSessionAccess.requireInvocation(weaveAction.tool, weaveAction.args);
        const weaveResult = await weaveSessionAccess.actionTable[weaveAction.tool](weaveAction.args || {}, weaveDepth + 1);
        weaveResults.push({
          tool: weaveAction.tool,
          success: true,
          result: weaveResult
        });
      } catch (weaveE) {
        weaveResults.push({
          tool: weaveAction?.tool,
          success: false,
          error: weaveE.message
        });
        if (weaveAction?.stopOnError) break;
      }
    }
    return {
      executed: weaveResults.length,
      results: weaveResults
    };
  },
  async retry({
    tool: weaveTool,
    args: weaveArgs = {},
    max_retries: weaveMax_retries = 3,
    delay_ms: weaveDelay_ms = 1000,
    success_check: weaveSuccess_check
  }, weaveDepth = 0) {
    if (weaveDepth > 5) throw new Error('retry recursion is nested too deeply (maximum 5 levels)');
    weaveSessionAccess.requireInvocation(weaveTool, weaveArgs);
    for (let weaveI = 0; weaveI < weaveMax_retries; weaveI++) {
      try {
        const weaveResult = await weaveSessionAccess.actionTable[weaveTool](weaveArgs, weaveDepth + 1);
        if (!weaveSuccess_check || weaveResult[weaveSuccess_check]) {
          return {
            success: true,
            attempts: weaveI + 1,
            result: weaveResult
          };
        }
      } catch (weaveE) {
        if (weaveI === weaveMax_retries - 1) return {
          success: false,
          attempts: weaveI + 1,
          error: weaveE.message
        };
      }
      await weaveSessionAccess.pauseFor(weaveDelay_ms);
    }
    return {
      success: false,
      attempts: weaveMax_retries
    };
  },
  async run_steps({
    steps: weaveSteps,
    auto_wait: weaveAuto_wait = true,
    retry_on_fail: weaveRetry_on_fail = true,
    max_step_retries: weaveMax_step_retries = 2,
    step_timeout: weaveStep_timeout = 10000,
    stop_on_error: weaveStop_on_error = true,
    return_intermediate: weaveReturn_intermediate = false
  }) {
    if (!Array.isArray(weaveSteps) || weaveSteps.length === 0) throw new Error('steps must be a non-empty array');
    if (weaveSteps.length > 50) throw new Error('steps up to 50 steps');
    const weaveRetryCount = Number(weaveMax_step_retries);
    if (!Number.isInteger(weaveRetryCount) || weaveRetryCount < 0 || weaveRetryCount > 10) {
      throw new Error('max_step_retries must be an integer from 0 to 10');
    }
    const weaveBLOCKED_TOOLS = new Set(['run_steps', 'batch', 'retry']);
    const weaveResults = [];
    let weaveLastResult = null;
    const weaveTotalStart = Date.now();
    for (let weaveI = 0; weaveI < weaveSteps.length; weaveI++) {
      const weaveStep = weaveSteps[weaveI] || {};
      const {
        tool: weaveTool,
        args: weaveArgs = {},
        wait_before: weaveWait_before,
        wait_after: weaveWait_after,
        optional: weaveOptional = false
      } = weaveStep;
      if (!weaveTool) {
        weaveResults.push({
          step: weaveI,
          tool: '?',
          success: false,
          error: 'Missing tool field'
        });
        if (weaveStop_on_error && !weaveOptional) break;
        continue;
      }
      if (weaveBLOCKED_TOOLS.has(weaveTool)) {
        weaveResults.push({
          step: weaveI,
          tool: weaveTool,
          success: false,
          error: `${weaveTool} is not allowed within run_steps`
        });
        if (weaveStop_on_error && !weaveOptional) break;
        continue;
      }
      try {
        weaveSessionAccess.requireInvocation(weaveTool, weaveArgs);
      } catch (weaveError) {
        weaveResults.push({
          step: weaveI,
          tool: weaveTool,
          success: false,
          error: weaveError.message
        });
        if (weaveStop_on_error && !weaveOptional) break;
        continue;
      }
      if (weaveWait_before > 0) await weaveSessionAccess.pauseFor(Math.min(weaveWait_before, 5000));
      const weaveAttemptsLimit = weaveRetry_on_fail ? 1 + weaveRetryCount : 1;
      let weaveStepResult = null;
      let weaveStepError = null;
      let weaveAttempts = 0;
      for (let weaveR = 0; weaveR < weaveAttemptsLimit; weaveR++) {
        weaveAttempts = weaveR + 1;
        let weaveTimer;
        try {
          const weaveTo = weaveStep.timeout || weaveStep_timeout;
          weaveStepResult = await Promise.race([weaveSessionAccess.actionTable[weaveTool](weaveArgs), new Promise((weave, weaveRej) => {
            weaveTimer = setTimeout(() => weaveRej(new Error(`Step ${weaveI} (${weaveTool}) timeout ${weaveTo}ms`)), weaveTo);
          })]);
          weaveStepError = null;
          break;
        } catch (weaveE) {
          weaveStepError = weaveE.message;
          if (weaveR < weaveAttemptsLimit - 1) {
            if (weaveAuto_wait) await weaveSessionAccess.pauseFor(500);
          }
        } finally {
          clearTimeout(weaveTimer);
        }
      }
      if (weaveStepError) {
        weaveResults.push({
          step: weaveI,
          tool: weaveTool,
          success: false,
          error: weaveStepError,
          attempts: weaveAttempts
        });
        if (weaveStop_on_error && !weaveOptional) break;
      } else {
        weaveLastResult = weaveStepResult;
        const weaveBrief = weaveSessionAccess.summarizeAction(weaveTool, weaveStepResult);
        if (weaveReturn_intermediate) {
          weaveResults.push({
            step: weaveI,
            tool: weaveTool,
            success: true,
            brief: weaveBrief,
            result: weaveStepResult,
            attempts: weaveAttempts
          });
        } else {
          weaveResults.push({
            step: weaveI,
            tool: weaveTool,
            success: true,
            brief: weaveBrief,
            attempts: weaveAttempts
          });
        }
      }
      if (weaveWait_after > 0) await weaveSessionAccess.pauseFor(Math.min(weaveWait_after, 5000));
    }
    const weaveTotalTime = Date.now() - weaveTotalStart;
    const weaveSucceeded = weaveResults.filter(weaveR => weaveR.success).length;
    const weaveFailed = weaveResults.filter(weaveR => !weaveR.success).length;
    let weavePageState;
    try {
      const weaveP = weaveSessionAccess.requireDocument();
      weavePageState = {
        url: weaveSessionAccess.documentAddress(weaveP),
        title: await weaveSessionAccess.documentTitle(weaveP)
      };
    } catch {}
    return {
      total_steps: weaveSteps.length,
      executed: weaveResults.length,
      succeeded: weaveSucceeded,
      failed: weaveFailed,
      total_time_ms: weaveTotalTime,
      steps: weaveResults,
      last_result: weaveLastResult,
      page: weavePageState
    };
  }
});
