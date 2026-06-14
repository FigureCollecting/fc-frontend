/**
 * Jest-only Babel plugin: make `import.meta.env` work under CommonJS.
 *
 * Vite replaces `import.meta.env.X` statically at build time. Jest compiles
 * source to CommonJS, where any `import.meta` token is a hard syntax error
 * ("Cannot use 'import.meta' outside a module"). This plugin rewrites:
 *
 *   import.meta.env  ->  process.env
 *   import.meta      ->  ({ env: process.env })   (bare references)
 *
 * so that src/config/env.ts (which reads import.meta.env with a process.env
 * fallback) resolves to process.env in tests. Tests already set the relevant
 * vars on process.env.
 */
module.exports = function importMetaEnvJest({ types: t }) {
  const metaEnvReplacement = () =>
    t.memberExpression(t.identifier('process'), t.identifier('env'));

  return {
    name: 'import-meta-env-jest',
    visitor: {
      MetaProperty(path) {
        // Matches the `import.meta` node.
        if (path.node.meta.name !== 'import' || path.node.property.name !== 'meta') {
          return;
        }

        const parent = path.parent;

        // import.meta.env -> process.env
        if (
          t.isMemberExpression(parent) &&
          ((!parent.computed && t.isIdentifier(parent.property, { name: 'env' })) ||
            (parent.computed && t.isStringLiteral(parent.property, { value: 'env' })))
        ) {
          path.parentPath.replaceWith(metaEnvReplacement());
          return;
        }

        // Bare import.meta -> { env: process.env }
        path.replaceWith(
          t.objectExpression([
            t.objectProperty(t.identifier('env'), metaEnvReplacement()),
          ])
        );
      },
    },
  };
};
