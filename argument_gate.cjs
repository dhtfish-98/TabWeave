const weavePath = require('path');
const weaveOs = require('os');
const weaveFs = require('fs');
const APPROVED_ROOTS = [...new Set(['/tmp', '/var/tmp', weaveOs.tmpdir(), weaveOs.homedir()].map(weaveD => weavePath.resolve(weaveD)))];
function resolveLocation(weaveInputPath) {
  let weaveCurrent = weavePath.resolve(weaveInputPath);
  const weaveMissing = [];
  while (true) {
    let weaveStat;
    try {
      weaveStat = weaveFs.lstatSync(weaveCurrent);
    } catch (weaveError) {
      if (weaveError.code !== 'ENOENT') throw weaveError;
      const weaveParent = weavePath.dirname(weaveCurrent);
      if (weaveParent === weaveCurrent) throw weaveError;
      weaveMissing.unshift(weavePath.basename(weaveCurrent));
      weaveCurrent = weaveParent;
      continue;
    }
    const weaveResolved = weaveFs.realpathSync(weaveCurrent);
    if (weaveMissing.length && !(weaveStat.isDirectory() || weaveFs.statSync(weaveResolved).isDirectory())) {
      throw new Error('A path parent is not a directory');
    }
    return weavePath.join(weaveResolved, ...weaveMissing);
  }
}
function approveLocation(weaveInputPath, weaveAllowedDirs = APPROVED_ROOTS) {
  if (!weaveInputPath || typeof weaveInputPath !== 'string') {
    return {
      valid: false,
      error: 'The path is empty'
    };
  }
  if (weaveInputPath.includes('\0')) {
    return {
      valid: false,
      error: 'Path contains a null byte'
    };
  }
  if (!Array.isArray(weaveAllowedDirs) || weaveAllowedDirs.some(weaveD => typeof weaveD !== 'string' || !weaveD || weaveD.includes('\0'))) {
    return {
      valid: false,
      error: 'Allowed directories must be an array of non-empty paths'
    };
  }
  try {
    const weaveNormalizedPath = resolveLocation(weaveInputPath);
    const weaveRoots = weaveAllowedDirs.map(weaveDir => {
      const weaveResolved = weaveFs.realpathSync(weavePath.resolve(weaveDir));
      if (!weaveFs.statSync(weaveResolved).isDirectory()) throw new Error('An allowed root is not a directory');
      return weaveResolved;
    });
    const weaveInAllowedDir = weaveRoots.some(weaveRoot => {
      const weaveRelative = weavePath.relative(weaveRoot, weaveNormalizedPath);
      return weaveRelative === '' || weaveRelative !== '..' && !weaveRelative.startsWith('..' + weavePath.sep) && !weavePath.isAbsolute(weaveRelative);
    });
    if (!weaveInAllowedDir) {
      return {
        valid: false,
        error: 'Path is not in allowed directory',
        path: weaveNormalizedPath
      };
    }
    return {
      valid: true,
      path: weaveNormalizedPath
    };
  } catch (weaveError) {
    return {
      valid: false,
      error: `Cannot resolve path or allowed directory: ${weaveError.message}`
    };
  }
}
function classifyValue(weaveValue) {
  if (weaveValue === null) return 'null';
  if (Array.isArray(weaveValue)) return 'array';
  return typeof weaveValue;
}
function describeValue(weaveValue) {
  if (typeof weaveValue === 'string') return JSON.stringify(weaveValue);
  if (weaveValue === null || weaveValue === undefined) return String(weaveValue);
  if (typeof weaveValue === 'number' || typeof weaveValue === 'boolean') return String(weaveValue);
  if (Array.isArray(weaveValue)) return 'array';
  return typeof weaveValue;
}
function acceptsKind(weaveValue, weaveDeclaredType) {
  if (classifyValue(weaveValue) === weaveDeclaredType) return true;
  if (weaveDeclaredType === 'number' && typeof weaveValue === 'string') {
    return weaveValue.trim() !== '' && Number.isFinite(Number(weaveValue));
  }
  return false;
}
const ACCEPTED_KINDS = ['string', 'number', 'boolean', 'object', 'array'];
function inspectInvocation(weaveToolName, weaveArgs, weaveSchema) {
  const weaveErrors = [];
  const weaveUnvalidated = [];
  try {
    if (!weaveSchema || typeof weaveSchema !== 'object' || Array.isArray(weaveSchema)) {
      return {
        valid: true,
        errors: weaveErrors,
        unvalidated: weaveUnvalidated
      };
    }
    const weaveProperties = weaveSchema.properties && typeof weaveSchema.properties === 'object' && !Array.isArray(weaveSchema.properties) ? weaveSchema.properties : {};
    const weaveRequired = Array.isArray(weaveSchema.required) ? weaveSchema.required : [];
    const weaveInput = weaveArgs === null || weaveArgs === undefined ? {} : weaveArgs;
    if (typeof weaveInput !== 'object' || Array.isArray(weaveInput)) {
      weaveErrors.push(`Arguments must be an object, got ${classifyValue(weaveInput)}`);
      return {
        valid: false,
        errors: weaveErrors,
        unvalidated: weaveUnvalidated
      };
    }
    for (const weaveKey of weaveRequired) {
      if (typeof weaveKey !== 'string') continue;
      if (weaveInput[weaveKey] === undefined) {
        weaveErrors.push(`Missing required argument: "${weaveKey}"`);
      }
    }
    for (const [weaveKey, weavePropSchema] of Object.entries(weaveProperties)) {
      const weaveValue = weaveInput[weaveKey];
      if (weaveValue === undefined) continue;
      if (!weavePropSchema || typeof weavePropSchema !== 'object' || Array.isArray(weavePropSchema)) continue;
      if (weavePropSchema.oneOf !== undefined || weavePropSchema.anyOf !== undefined) {
        weaveUnvalidated.push(weaveKey);
        continue;
      }
      const weaveDeclaredType = weavePropSchema.type;
      if (weaveDeclaredType === undefined) {} else if (typeof weaveDeclaredType !== 'string' || !ACCEPTED_KINDS.includes(weaveDeclaredType)) {
        weaveUnvalidated.push(weaveKey);
        continue;
      } else if (!acceptsKind(weaveValue, weaveDeclaredType)) {
        weaveErrors.push(`Invalid type for "${weaveKey}": expected ${weaveDeclaredType}, got ${classifyValue(weaveValue)}`);
        continue;
      }
      if (Array.isArray(weavePropSchema.enum) && weavePropSchema.enum.indexOf(weaveValue) === -1) {
        weaveErrors.push(`Invalid value for "${weaveKey}": expected one of [${weavePropSchema.enum.map(describeValue).join(', ')}], got ${describeValue(weaveValue)}`);
      }
    }
    return {
      valid: weaveErrors.length === 0,
      errors: weaveErrors,
      unvalidated: weaveUnvalidated
    };
  } catch (weaveE) {
    return {
      valid: false,
      errors: [`Argument validation failed for tool "${weaveToolName}": ${weaveE && weaveE.message ? weaveE.message : String(weaveE)}`],
      unvalidated: weaveUnvalidated
    };
  }
}
module.exports = {
  approveLocation: approveLocation,
  inspectInvocation: inspectInvocation,
  APPROVED_ROOTS: APPROVED_ROOTS
};
