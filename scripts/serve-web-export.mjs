#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT ?? process.argv[2] ?? 8099);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl ?? '/', 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  return path.join(distDir, normalizedPath);
}

async function resolveFile(requestUrl) {
  const requestedPath = resolveRequestPath(requestUrl);
  const relativePath = path.relative(distDir, requestedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return { status: 403 };
  }

  if (await fileExists(requestedPath)) {
    const fileStat = await stat(requestedPath);

    if (fileStat.isFile()) {
      return { filePath: requestedPath, status: 200 };
    }
  }

  const hasExtension = path.extname(requestedPath).length > 0;

  if (hasExtension) {
    return { status: 404 };
  }

  return { filePath: path.join(distDir, 'index.html'), status: 200 };
}

export function createWebExportServer() {
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405);
      response.end();
      return;
    }

    const result = await resolveFile(request.url);

    if (!result.filePath) {
      response.writeHead(result.status);
      response.end();
      return;
    }

    const contentType = mimeTypes.get(path.extname(result.filePath)) ?? 'application/octet-stream';
    response.writeHead(result.status, {
      'Cache-Control': 'no-store',
      'Content-Type': contentType,
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    createReadStream(result.filePath).pipe(response);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!(await fileExists(path.join(distDir, 'index.html')))) {
    console.error('dist/index.html not found. Run `npm run export:web` first.');
    process.exit(1);
  }

  const server = createWebExportServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Serving web export with SPA fallback at http://127.0.0.1:${port}`);
  });
}
