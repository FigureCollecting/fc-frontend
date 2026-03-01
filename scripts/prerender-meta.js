#!/usr/bin/env node

/**
 * Post-build script that generates per-route index.html files with
 * route-specific meta tags baked in. This ensures social media crawlers
 * (Facebook, Discord, Twitter) and search engines see correct titles and
 * descriptions without executing JavaScript.
 *
 * No external dependencies — uses only Node.js built-ins.
 *
 * How it works:
 *   1. Reads build/index.html (the CRA output)
 *   2. For each public route, replaces <title>, <meta description>,
 *      <link canonical>, og:*, and twitter:* tags with route-specific values
 *   3. Writes build/{route}/index.html
 *
 * nginx serves these via `try_files $uri $uri/ /index.html` — a request
 * to /login resolves to login/index.html before falling back to root.
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const BASE_URL = 'https://figurecollecting.com';

const routes = {
  'login': {
    title: 'Sign In — FigureCollecting',
    description: 'Sign in to FigureCollecting — your personal figure collection catalog. Sync with MyFigureCollection, search in milliseconds, and organize with flexible layouts.',
  },
  'register': {
    title: 'Create Account — FigureCollecting',
    description: 'Create your free FigureCollecting account. Catalog your anime figures, sync your MyFigureCollection data, and organize your collection with powerful tools.',
  },
  'forgot-password': {
    title: 'Forgot Password — FigureCollecting',
    description: 'Reset your FigureCollecting password. Enter your email to receive a password reset link.',
  },
  'reset-password': {
    title: 'Reset Password — FigureCollecting',
    description: 'Set a new password for your FigureCollecting account.',
  },
};

function replaceMetaTags(html, route, meta) {
  const url = `${BASE_URL}/${route}`;

  let result = html;

  // <title>...</title>
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

  // <meta name="description" content="...">
  result = result.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${meta.description}" />`
  );

  // <link rel="canonical" href="...">
  result = result.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`
  );

  // og:title
  result = result.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${meta.title}" />`
  );

  // og:description
  result = result.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${meta.description}" />`
  );

  // og:url
  result = result.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`
  );

  // twitter:title
  result = result.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${meta.title}" />`
  );

  // twitter:description
  result = result.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${meta.description}" />`
  );

  return result;
}

function main() {
  const indexPath = path.join(BUILD_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('Error: build/index.html not found. Run "npm run build" first.');
    process.exit(1);
  }

  const html = fs.readFileSync(indexPath, 'utf-8');
  let generated = 0;

  for (const [route, meta] of Object.entries(routes)) {
    const routeDir = path.join(BUILD_DIR, route);
    const routeIndex = path.join(routeDir, 'index.html');

    fs.mkdirSync(routeDir, { recursive: true });

    const routeHtml = replaceMetaTags(html, route, meta);
    fs.writeFileSync(routeIndex, routeHtml, 'utf-8');
    generated++;

    console.log(`  ✓ ${route}/index.html`);
  }

  console.log(`\nPre-rendered ${generated} route(s) with custom meta tags.`);
}

main();
