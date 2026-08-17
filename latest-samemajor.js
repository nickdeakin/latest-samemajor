#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { maxSatisfying, coerce, validRange, gt } from 'semver';

const pkgPath = resolve(process.argv[2] || 'package.json');

// ANSI colours
const yellow = (str) => `\x1b[33m${str}\x1b[0m`;
const dim = (str) => `\x1b[2m${str}\x1b[0m`;

async function getLatestForMajor(pkg, major) {
  const range = `${major}.x`;
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.npm.install-v1+json, application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 404) return { error: 'not found' };
    return { error: `${res.status} ${res.statusText}` };
  }

  const data = await res.json();
  const versions = Object.keys(data.versions || {});
  const latest = maxSatisfying(versions, range, { includePrerelease: false });

  return latest ? { latest } : { error: `no ${major}.x version` };
}

function extractMajor(specifier) {
  if (!specifier || typeof specifier !== 'string') return null;

  if (
    specifier.startsWith('git') ||
    specifier.startsWith('http') ||
    specifier.startsWith('file:') ||
    specifier === '*' ||
    specifier === 'latest' ||
    !validRange(specifier)
  ) {
    return null;
  }

  const coerced = coerce(specifier);
  return coerced ? coerced.major : null;
}

async function processDeps(deps) {
  const entries = Object.entries(deps || {});
  const results = [];

  const concurrency = 6;
  for (let i = 0; i < entries.length; i += concurrency) {
    const chunk = entries.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(async ([name, specifier]) => {
        const major = extractMajor(specifier);

        if (major === null) {
          return {
            name,
            current: specifier,
            latest: null,
            note: 'skipped (non-semver or wildcard)'
          };
        }

        const result = await getLatestForMajor(name, major);

        return {
          name,
          current: specifier,
          major,
          latest: result.latest || null,
          note: result.error || null
        };
      })
    );

    results.push(...chunkResults);
  }

  // Hide anything that failed
  return results.filter(r => r.latest !== null);
}

function printGroup(title, results) {
  if (results.length === 0) return;

  console.log(`\n${title}`);
  console.log('─'.repeat(title.length));

  const nameWidth = Math.max(...results.map(r => r.name.length), 10);
  const currentWidth = Math.max(...results.map(r => String(r.current).length), 10);

  console.log(
    'Package'.padEnd(nameWidth),
    'Current'.padEnd(currentWidth),
    'Latest (same major)'
  );
  console.log('-'.repeat(nameWidth + currentWidth + 22));

  for (const r of results) {
    const currentVersion = coerce(r.current);
    const hasUpdate = currentVersion && gt(r.latest, currentVersion);

    const latestDisplay = hasUpdate
      ? yellow(r.latest) + '  ← update available'
      : dim(r.latest);

    console.log(
      r.name.padEnd(nameWidth),
      String(r.current).padEnd(currentWidth),
      latestDisplay
    );
  }
}

async function main() {
  let pkgJson;
  try {
    const raw = await readFile(pkgPath, 'utf8');
    pkgJson = JSON.parse(raw);
  } catch (err) {
    console.error(`Could not read ${pkgPath}:`, err.message);
    process.exit(1);
  }

  console.log(`Checking dependencies from ${pkgPath}...`);

  const [depsResults, devResults] = await Promise.all([
    processDeps(pkgJson.dependencies),
    processDeps(pkgJson.devDependencies)
  ]);

  printGroup('Dependencies', depsResults);
  printGroup('Dev Dependencies', devResults);

  if (depsResults.length === 0 && devResults.length === 0) {
    console.log('\nNo matching dependencies found.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});