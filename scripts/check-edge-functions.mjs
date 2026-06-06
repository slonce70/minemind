#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = path.join(rootDir, 'supabase', 'functions');

async function listFunctionEntrypoints() {
  const entries = await readdir(functionsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => path.join(functionsDir, entry.name, 'index.ts'))
    .sort();
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

const entrypoints = await listFunctionEntrypoints();

if (entrypoints.length === 0) {
  console.error('No Supabase Edge Function entrypoints found.');
  process.exit(1);
}

try {
  await run('deno', ['check', ...entrypoints]);
  console.log(`Deno checked ${entrypoints.length} Supabase Edge Function entrypoint(s).`);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Deno is required for Edge Function checks. Install Deno locally or use the CI setup-deno step.');
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }

  process.exit(1);
}
