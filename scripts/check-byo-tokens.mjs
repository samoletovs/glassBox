#!/usr/bin/env node
// BYO-tokens guard: the glassBox app must ship NO embedded LLM. This fails the build if any
// AI-model SDK import appears in app code. Intelligence comes from the USER's coding agent.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'api/src', 'scripts'];
const SELF = 'check-byo-tokens';
const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

// Forbidden model-SDK package names (import/require targets).
const FORBIDDEN = [
  'openai',
  '@azure/openai',
  '@anthropic-ai/sdk',
  'anthropic',
  '@google/generative-ai',
  '@google-cloud/aiplatform',
  'cohere-ai',
  'mistralai',
  'replicate',
  'langchain',
  '@langchain/core',
  'llamaindex',
  'ai', // Vercel AI SDK
];

const importRe = (pkg) =>
  new RegExp(
    `(?:import[^'"\\n]*from\\s*|import\\s*|require\\(\\s*|import\\(\\s*)['"]${pkg.replace(
      /[/\\^$*+?.()|[\]{}]/g,
      '\\$&',
    )}(?:/[^'"]*)?['"]`,
  );

function walk(dir) {
  let files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (['node_modules', 'dist', '.data'].includes(name)) continue;
      files = files.concat(walk(full));
    } else if (EXTS.has(extname(name)) && !full.includes(SELF)) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const content = readFileSync(file, 'utf8');
    for (const pkg of FORBIDDEN) {
      if (importRe(pkg).test(content)) {
        violations.push(`${file} → imports "${pkg}"`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n✖ BYO-tokens violated — the app must ship NO embedded LLM:\n');
  for (const v of violations) console.error(`  - ${v}`);
  console.error('\nIntelligence must come from the user\u2019s coding agent, not the app.\n');
  process.exit(1);
}

console.log('✓ BYO-tokens guard passed — no AI-model SDK imports in app code.');
