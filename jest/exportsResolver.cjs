'use strict';

// Jest 27's bundled resolver predates the package `exports` field and resolves
// bare specifiers via the legacy `main`/`module` fields only. Chakra UI v3 and
// its Ark UI / Zag.js dependency tree pull in several packages (e.g.
// `proxy-compare`, `uqr`, `@zag-js/*`, `@ark-ui/react`) that only ship a correct
// CommonJS entry behind their `exports` map's `require` condition while `main`
// points at an ESM build. Without honoring `exports`, Jest loads the ESM build
// and chokes on `export` syntax.
//
// This resolver consults the package `exports` map (via the `resolve.exports`
// helper, already in the tree) using CommonJS conditions, and only then falls
// back to Jest's default resolver. It is intentionally conservative: it only
// intervenes for bare package specifiers that actually declare an `exports`
// field, leaving relative/absolute imports and classic packages to the default.

const fs = require('fs');
const path = require('path');
const { resolve: resolveExports } = require('resolve.exports');

const PACKAGE_RE = /^(@[^/]+\/[^/]+|[^@/][^/]*)(\/.*)?$/;

function findPackageDir(name, basedir) {
  // Walk up from basedir looking for node_modules/<name>/package.json
  let dir = basedir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(candidate)) return path.dirname(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

module.exports = function exportsResolver(request, options) {
  const { defaultResolver, basedir, conditions } = options;

  const match = PACKAGE_RE.exec(request);
  if (match) {
    const pkgName = match[1];
    const pkgDir = findPackageDir(pkgName, basedir);
    if (pkgDir) {
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
        );
        if (pkgJson.exports) {
          // resolve.exports v1 API: resolve(pkg, fullRequest, options).
          // Prefer the CommonJS entry (require/node conditions).
          const resolved = resolveExports(pkgJson, request, {
            require: true,
            browser: false,
            conditions: ['node', ...(conditions || [])],
          });
          const target = Array.isArray(resolved) ? resolved[0] : resolved;
          if (target) {
            const abs = path.join(pkgDir, target);
            if (fs.existsSync(abs)) return abs;
          }
        }
      } catch (e) {
        // Fall through to the default resolver on any parsing/resolution error.
      }
    }
  }

  return defaultResolver(request, options);
};
