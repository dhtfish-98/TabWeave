const spec = require('node:test');
const verify = require('node:assert/strict');
const {
  PassThrough
} = require('node:stream');
const {
  LineExchange
} = require('../stdio_channel.cjs');
async function exchange(chunks, answer) {
  const incoming = new PassThrough();
  const outgoing = new PassThrough();
  const diagnostics = new PassThrough();
  let transcript = '';
  outgoing.on('data', fragment => {
    transcript += fragment;
  });
  diagnostics.resume();
  let finish;
  const completed = new Promise(completeAudit => {
    finish = completeAudit;
  });
  new LineExchange(answer, incoming, outgoing, diagnostics, finish).open();
  for (const fragment of chunks) incoming.write(fragment);
  incoming.end();
  await completed;
  return transcript.split('\n').filter(Boolean).map(messageLineAudit => JSON.parse(messageLineAudit));
}
spec('fragmented UTF-8 messages remain ordered while an earlier reply is pending', async () => {
  const observedOrderAudit = [];
  const bytes = Buffer.from('{"id":1,"text":"魚"}\n{"id":2}\n');
  const exchangeRepliesAudit = await exchange(Array.from(bytes, byte => Buffer.from([byte])), async envelope => {
    observedOrderAudit.push(envelope.id);
    await new Promise(completeAudit => setTimeout(completeAudit, 1));
    return {
      id: envelope.id,
      result: envelope.text || 'ok'
    };
  });
  verify.deepEqual(observedOrderAudit, [1, 2]);
  verify.deepEqual(exchangeRepliesAudit, [{
    id: 1,
    result: '魚'
  }, {
    id: 2,
    result: 'ok'
  }]);
});
spec('blank lines and malformed JSON retain their distinct baseline handling', async () => {
  const exchangeRepliesAudit = await exchange(['\n invalid\n{"id":7}\n'], async envelope => ({
    id: envelope.id
  }));
  verify.equal(exchangeRepliesAudit[0].error.code, -32700);
  verify.equal(exchangeRepliesAudit[0].id, null);
  verify.deepEqual(exchangeRepliesAudit[1], {
    id: 7
  });
});
spec('EOF drains complete lines and preserves the baseline incomplete-line behavior', async () => {
  const exchangeRepliesAudit = await exchange(['{"id":9}\n{"id":10}'], async envelope => ({
    id: envelope.id
  }));
  verify.deepEqual(exchangeRepliesAudit, [{
    id: 9
  }]);
});
