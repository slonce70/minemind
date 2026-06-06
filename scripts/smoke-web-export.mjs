#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { once } from 'node:events';

import { createWebExportServer } from './serve-web-export.mjs';

const routes = ['/', '/home', '/solo', '/rooms', '/classroom'];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { response, text };
}

await run('npx', ['expo', 'export', '--platform', 'web']);

const server = createWebExportServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');

const { port } = server.address();
const failures = [];

try {
  for (const route of routes) {
    const url = `http://127.0.0.1:${port}${route}`;
    const { response, text } = await fetchText(url);

    if (response.status !== 200) {
      failures.push(`${route}: expected 200, got ${response.status}`);
      continue;
    }

    if (!text.includes('<div id="root"></div>') || !text.includes('/_expo/static/js/web/')) {
      failures.push(`${route}: response is not the exported app shell`);
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length > 0) {
  console.error(`Web export smoke failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Web export smoke passed for ${routes.join(', ')}`);
