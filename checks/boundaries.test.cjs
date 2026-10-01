const weaveTest = require('node:test');
const weaveAssert = require('node:assert');
const weavePath = require('path');
const weaveOs = require('os');
const weaveFs = require('fs');
const {
  approveLocation: approveLocation,
  inspectInvocation: inspectInvocation,
  APPROVED_ROOTS: APPROVED_ROOTS
} = require("../argument_gate.cjs");
const weaveNavigateSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string'
    },
    wait_until: {
      type: 'string',
      enum: ['load', 'domcontentloaded', 'networkidle']
    },
    timeout: {
      type: 'number'
    }
  },
  required: ['url']
};
const weaveUploadFileSchema = {
  type: 'object',
  properties: {
    selector: {
      type: 'string'
    },
    files: {
      oneOf: [{
        type: 'string'
      }, {
        type: 'array',
        items: {
          type: 'string'
        }
      }]
    }
  },
  required: ['selector', 'files']
};
const weaveFillFormSchema = {
  type: 'object',
  properties: {
    fields: {
      type: 'object'
    },
    submit: {
      type: 'boolean'
    }
  },
  required: ['fields']
};
const weavePressKeySchema = {
  type: 'object',
  properties: {
    key: {
      type: 'string'
    },
    modifiers: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  required: ['key']
};
function weaveWithCwd(weaveDir, weaveFn) {
  const weavePrevious = process.cwd();
  process.chdir(weaveDir);
  try {
    return weaveFn();
  } finally {
    process.chdir(weavePrevious);
  }
}
weaveTest('DEFAULT_ALLOWED_DIRS_RESOLVED holds the resolved default directories', () => {
  weaveAssert.ok(Array.isArray(APPROVED_ROOTS));
  for (const weaveDir of ['/tmp', '/var/tmp', weaveOs.tmpdir(), weaveOs.homedir()]) {
    weaveAssert.ok(APPROVED_ROOTS.includes(weavePath.resolve(weaveDir)), `expected ${weavePath.resolve(weaveDir)} in DEFAULT_ALLOWED_DIRS_RESOLVED`);
  }
});
weaveTest('validatePath rejects empty and non-string input', () => {
  for (const weaveInput of ['', null, undefined, 42, {}, [], true]) {
    const weaveResult = approveLocation(weaveInput);
    weaveAssert.strictEqual(weaveResult.valid, false, `expected ${JSON.stringify(weaveInput)} to be rejected`);
    weaveAssert.strictEqual(weaveResult.error, 'The path is empty');
    weaveAssert.strictEqual('path' in weaveResult, false);
  }
});
weaveTest('validatePath accepts an absolute path inside an allowed directory', () => {
  const weaveFile = weavePath.join(weaveOs.homedir(), 'ubm-validation-test', 'shot.png');
  const weaveResult = approveLocation(weaveFile);
  weaveAssert.strictEqual(weaveResult.valid, true);
  weaveAssert.strictEqual(weaveResult.path, weavePath.resolve(weaveFile));
  const weaveTmpFile = weavePath.join(weaveOs.tmpdir(), 'ubm-validation-test', 'shot.png');
  weaveAssert.strictEqual(approveLocation(weaveTmpFile).valid, true);
});
weaveTest('validatePath resolves a relative path against the working directory', () => {
  const weaveInside = weaveWithCwd(weaveOs.homedir(), () => approveLocation('ubm-validation-test/shot.png'));
  weaveAssert.strictEqual(weaveInside.valid, true);
  weaveAssert.strictEqual(weaveInside.path, weavePath.join(weaveOs.homedir(), 'ubm-validation-test', 'shot.png'));
  const weaveRoot = weavePath.parse(process.cwd()).root;
  const weaveOutside = weaveWithCwd(weaveRoot, () => approveLocation('ubm-validation-test/shot.png'));
  weaveAssert.strictEqual(weaveOutside.valid, false);
  weaveAssert.strictEqual(weaveOutside.error, 'Path is not in allowed directory');
  weaveAssert.strictEqual(weaveOutside.path, weavePath.join(weaveRoot, 'ubm-validation-test', 'shot.png'));
});
weaveTest('validatePath accepts .. traversal that resolves inside an allowed directory', () => {
  const weaveInput = weaveOs.homedir() + '/ubm-validation-test/../shot.png';
  weaveAssert.ok(weaveInput.includes('..'), 'test input must contain ..');
  const weaveResult = approveLocation(weaveInput);
  weaveAssert.strictEqual(weaveResult.valid, true);
  weaveAssert.strictEqual(weaveResult.path, weavePath.join(weaveOs.homedir(), 'shot.png'));
});
weaveTest('validatePath rejects .. traversal that resolves outside every allowed directory', () => {
  const weaveInput = '/tmp/../etc/passwd';
  weaveAssert.ok(weaveInput.includes('..'), 'test input must contain ..');
  const weaveResult = approveLocation(weaveInput);
  weaveAssert.strictEqual(weaveResult.valid, false);
  weaveAssert.strictEqual(weaveResult.error, 'Path is not in allowed directory');
  weaveAssert.strictEqual(weaveResult.path, weaveFs.realpathSync('/etc/passwd'));
});
weaveTest('validatePath does not accept a prefix sibling of an allowed directory', () => {
  weaveAssert.strictEqual(approveLocation('/tmp').valid, true, 'the allowed directory itself is accepted');
  const weaveSibling = approveLocation('/tmpfoo/ubm.txt');
  weaveAssert.strictEqual(weaveSibling.valid, false);
  weaveAssert.strictEqual(weaveSibling.error, 'Path is not in allowed directory');
  weaveAssert.strictEqual(weaveSibling.path, '/tmpfoo/ubm.txt');
  weaveAssert.strictEqual(approveLocation('/tmpfoo').valid, false);
});
weaveTest('validatePath rejects a path outside every allowed directory', () => {
  const weaveResult = approveLocation('/etc/passwd');
  weaveAssert.strictEqual(weaveResult.valid, false);
  weaveAssert.strictEqual(weaveResult.error, 'Path is not in allowed directory');
  weaveAssert.strictEqual(weaveResult.path, weaveFs.realpathSync('/etc/passwd'));
});
weaveTest('custom allowedDirs replaces defaults and an empty list denies all paths', () => {
  weaveAssert.strictEqual(approveLocation('/tmp/../etc/passwd', ['/etc']).valid, true);
  weaveAssert.strictEqual(approveLocation('/tmp/ubm-custom.txt', ['/etc']).valid, false);
  weaveAssert.strictEqual(approveLocation('/tmp/ubm-custom.txt', []).valid, false);
  for (const weaveRoots of [null, 'tmp', [null], [''], ['/nonexistent-ubm-dir']]) {
    weaveAssert.strictEqual(approveLocation('/tmp/ubm-custom.txt', weaveRoots).valid, false);
  }
  weaveAssert.strictEqual(approveLocation('/tmp/ubm\0.txt').valid, false);
});
weaveTest('symlink resolution enforces the actual file and output-parent boundary', weaveT => {
  const weaveBase = weaveFs.mkdtempSync(weavePath.join(weaveOs.tmpdir(), 'ubm-path-'));
  weaveT.after(() => weaveFs.rmSync(weaveBase, {
    recursive: true,
    force: true
  }));
  const weaveInside = weavePath.join(weaveBase, 'allowed');
  const weaveOutside = weavePath.join(weaveBase, 'allowed-sibling');
  weaveFs.mkdirSync(weaveInside);
  weaveFs.mkdirSync(weaveOutside);
  const weaveFile = weavePath.join(weaveInside, 'input.txt');
  weaveFs.writeFileSync(weaveFile, 'synthetic fixture');
  weaveFs.writeFileSync(weavePath.join(weaveOutside, 'other.txt'), 'synthetic fixture');
  weaveFs.symlinkSync(weaveOutside, weavePath.join(weaveInside, 'escape'));
  weaveFs.symlinkSync(weaveFile, weavePath.join(weaveInside, 'internal-link'));
  weaveFs.symlinkSync(weavePath.join(weaveOutside, 'other.txt'), weavePath.join(weaveInside, 'external-link'));
  weaveFs.symlinkSync(weavePath.join(weaveBase, 'missing'), weavePath.join(weaveInside, 'dangling'));
  weaveFs.symlinkSync('loop', weavePath.join(weaveInside, 'loop'));
  const weaveRoots = [weaveInside];
  for (const weaveCandidate of [weaveOutside, weavePath.join(weaveInside, 'escape', 'other.txt'), weavePath.join(weaveInside, 'escape', 'new', 'shot.png'), weavePath.join(weaveInside, 'external-link'), weavePath.join(weaveInside, 'dangling'), weavePath.join(weaveInside, 'dangling', 'new.png'), weavePath.join(weaveInside, 'loop'), weavePath.join(weaveFile, 'child')]) {
    weaveAssert.strictEqual(approveLocation(weaveCandidate, weaveRoots).valid, false, weaveCandidate);
  }
  weaveAssert.deepStrictEqual(approveLocation(weavePath.join(weaveInside, 'internal-link'), weaveRoots), {
    valid: true,
    path: weaveFs.realpathSync(weaveFile)
  });
  const weaveNewFile = weavePath.join(weaveInside, 'new', 'shot.png');
  weaveAssert.deepStrictEqual(approveLocation(weaveNewFile, weaveRoots), {
    valid: true,
    path: weavePath.join(weaveFs.realpathSync(weaveInside), 'new', 'shot.png')
  });
  const weaveRootAlias = weavePath.join(weaveBase, 'root-alias');
  weaveFs.symlinkSync(weaveInside, weaveRootAlias);
  weaveAssert.strictEqual(approveLocation(weaveFile, [weaveRootAlias]).valid, true);
});
weaveTest('validateToolArgs reports a missing required key', () => {
  const weaveResult = inspectInvocation('navigate', {
    wait_until: 'load'
  }, weaveNavigateSchema);
  weaveAssert.strictEqual(weaveResult.valid, false);
  weaveAssert.deepStrictEqual(weaveResult.errors, ['Missing required argument: "url"']);
  weaveAssert.deepStrictEqual(weaveResult.unvalidated, []);
});
weaveTest('validateToolArgs treats omitted arguments as an empty object', () => {
  for (const weaveArgs of [undefined, null, {}]) {
    const weaveResult = inspectInvocation('navigate', weaveArgs, weaveNavigateSchema);
    weaveAssert.strictEqual(weaveResult.valid, false);
    weaveAssert.deepStrictEqual(weaveResult.errors, ['Missing required argument: "url"']);
  }
});
weaveTest('validateToolArgs reports type mismatches', () => {
  weaveAssert.deepStrictEqual(inspectInvocation('navigate', {
    url: 42
  }, weaveNavigateSchema).errors, ['Invalid type for "url": expected string, got number']);
  weaveAssert.deepStrictEqual(inspectInvocation('navigate', {
    url: 'https://example.com',
    timeout: '3000'
  }, weaveNavigateSchema).errors, []);
  weaveAssert.deepStrictEqual(inspectInvocation('navigate', {
    url: 'https://example.com',
    timeout: 'soon'
  }, weaveNavigateSchema).errors, ['Invalid type for "timeout": expected number, got string']);
  weaveAssert.deepStrictEqual(inspectInvocation('navigate', {
    url: null
  }, weaveNavigateSchema).errors, ['Invalid type for "url": expected string, got null']);
  weaveAssert.deepStrictEqual(inspectInvocation('fill_form', {
    fields: []
  }, weaveFillFormSchema).errors, ['Invalid type for "fields": expected object, got array']);
  weaveAssert.deepStrictEqual(inspectInvocation('fill_form', {
    fields: {},
    submit: 'yes'
  }, weaveFillFormSchema).errors, ['Invalid type for "submit": expected boolean, got string']);
  weaveAssert.deepStrictEqual(inspectInvocation('press_key', {
    key: 'Enter',
    modifiers: 'Shift'
  }, weavePressKeySchema).errors, ['Invalid type for "modifiers": expected array, got string']);
  weaveAssert.deepStrictEqual(inspectInvocation('navigate', 'https://example.com', weaveNavigateSchema).errors, ['Arguments must be an object, got string']);
});
weaveTest('validateToolArgs accepts valid calls and ignores unknown keys', () => {
  const weaveValid = inspectInvocation('navigate', {
    url: 'https://example.com',
    wait_until: 'load',
    timeout: 1500
  }, weaveNavigateSchema);
  weaveAssert.strictEqual(weaveValid.valid, true);
  weaveAssert.deepStrictEqual(weaveValid.errors, []);
  const weaveExtra = inspectInvocation('navigate', {
    url: 'https://example.com',
    unexpected: 1
  }, weaveNavigateSchema);
  weaveAssert.strictEqual(weaveExtra.valid, true);
  const weaveObjects = inspectInvocation('fill_form', {
    fields: {
      '#a': 'b'
    },
    submit: true
  }, weaveFillFormSchema);
  weaveAssert.strictEqual(weaveObjects.valid, true);
  const weaveArrays = inspectInvocation('press_key', {
    key: 'Enter',
    modifiers: ['Shift', 'Control']
  }, weavePressKeySchema);
  weaveAssert.strictEqual(weaveArrays.valid, true);
});
weaveTest('validateToolArgs reports an enum violation', () => {
  const weaveResult = inspectInvocation('navigate', {
    url: 'https://example.com',
    wait_until: 'whenever'
  }, weaveNavigateSchema);
  weaveAssert.strictEqual(weaveResult.valid, false);
  weaveAssert.deepStrictEqual(weaveResult.errors, ['Invalid value for "wait_until": expected one of ["load", "domcontentloaded", "networkidle"], got "whenever"']);
});
weaveTest('validateToolArgs accepts calls with no schema to check against', () => {
  for (const weaveSchema of [undefined, null, [], 'not-a-schema']) {
    const weaveResult = inspectInvocation('unknown_tool', {
      anything: 1
    }, weaveSchema);
    weaveAssert.strictEqual(weaveResult.valid, true);
    weaveAssert.deepStrictEqual(weaveResult.errors, []);
  }
  const weaveNoArgs = inspectInvocation();
  weaveAssert.strictEqual(weaveNoArgs.valid, true);
  weaveAssert.deepStrictEqual(weaveNoArgs.errors, []);
  weaveAssert.strictEqual(inspectInvocation('status', {
    anything: 1
  }, {
    type: 'object',
    properties: {}
  }).valid, true);
});
weaveTest('validateToolArgs enforces required but does not type-check a oneOf property', () => {
  const weaveMissing = inspectInvocation('upload_file', {
    selector: '#file'
  }, weaveUploadFileSchema);
  weaveAssert.strictEqual(weaveMissing.valid, false);
  weaveAssert.deepStrictEqual(weaveMissing.errors, ['Missing required argument: "files"']);
  const weaveStringForm = inspectInvocation('upload_file', {
    selector: '#file',
    files: '/tmp/a.txt'
  }, weaveUploadFileSchema);
  weaveAssert.strictEqual(weaveStringForm.valid, true);
  weaveAssert.deepStrictEqual(weaveStringForm.unvalidated, ['files']);
  const weaveNotAStringOrArray = inspectInvocation('upload_file', {
    selector: '#file',
    files: 42
  }, weaveUploadFileSchema);
  weaveAssert.strictEqual(weaveNotAStringOrArray.valid, true, 'oneOf properties are not type-checked');
  weaveAssert.deepStrictEqual(weaveNotAStringOrArray.unvalidated, ['files']);
  const weaveSelectorType = inspectInvocation('upload_file', {
    selector: 42,
    files: '/tmp/a.txt'
  }, weaveUploadFileSchema);
  weaveAssert.deepStrictEqual(weaveSelectorType.errors, ['Invalid type for "selector": expected string, got number']);
});
weaveTest('validateToolArgs does not throw on malformed arguments or schemas', () => {
  const weaveCircular = {};
  weaveCircular.self = weaveCircular;
  const weaveInputs = [weaveCircular, Object.create(null), 'text', 7, [{
    url: 'x'
  }]];
  const weaveSchemas = [undefined, {
    type: 'object',
    required: 'url',
    properties: 'nope'
  }, {
    type: 'object',
    properties: {
      url: null
    },
    required: ['url', 42]
  }, {
    type: 'object',
    properties: {
      url: {
        type: 'integer'
      }
    },
    required: ['url']
  }, {
    type: 'object',
    properties: {
      url: {
        enum: []
      }
    }
  }, {
    type: 'object',
    properties: {
      url: {
        oneOf: 'nope'
      }
    }
  }];
  for (const weaveSchema of weaveSchemas) {
    for (const weaveArgs of weaveInputs) {
      const weaveResult = inspectInvocation('x', weaveArgs, weaveSchema);
      weaveAssert.strictEqual(typeof weaveResult.valid, 'boolean');
      weaveAssert.ok(Array.isArray(weaveResult.errors));
      weaveAssert.ok(Array.isArray(weaveResult.unvalidated));
    }
  }
  const weaveUnsupported = inspectInvocation('x', {
    url: 'text'
  }, {
    type: 'object',
    properties: {
      url: {
        type: 'integer'
      }
    }
  });
  weaveAssert.strictEqual(weaveUnsupported.valid, true);
  weaveAssert.deepStrictEqual(weaveUnsupported.unvalidated, ['url']);
});
