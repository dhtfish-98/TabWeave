/** Ordered newline-delimited JSON exchange for the browser action service. */
class LineExchange {
  constructor(answer, inboundStream = process.stdin, outboundStream = process.stdout, diagnosticStream = process.stderr, finish = () => process.exit(0)) {
    this.answer = answer;
    this.inboundStream = inboundStream;
    this.outboundStream = outboundStream;
    this.diagnosticStream = diagnosticStream;
    this.finish = finish;
    this.pending = '';
    this.draining = false;
    this.ended = false;
  }
  open() {
    this.inboundStream.setEncoding('utf8');
    this.inboundStream.on('data', fragment => { this.pending += fragment; void this.drain(); });
    this.inboundStream.on('end', () => { this.ended = true; if (!this.draining) void this.drain(); });
  }
  async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      for (;;) {
        const boundary = this.pending.indexOf('\n');
        if (boundary < 0) break;
        const document = this.pending.slice(0, boundary);
        this.pending = this.pending.slice(boundary + 1);
        if (document.trim() === '') continue;
        try {
          const completionReply = await this.answer(JSON.parse(document));
          if (completionReply) this.outboundStream.write((typeof completionReply === 'string' ? completionReply : JSON.stringify(completionReply)) + '\n');
        } catch (failure) {
          this.diagnosticStream.write('Parsing error: ' + failure.message + '\n');
          this.outboundStream.write(JSON.stringify({jsonrpc:'2.0', id:null, error:{code:-32700,message:'JSON parsing error: '+failure.message}})+'\n');
        }
      }
    } finally {
      this.draining = false;
      if (this.ended) { this.diagnosticStream.write('[TabWeave MCP] ended\n'); this.finish(); }
    }
  }
}
module.exports = { LineExchange };
