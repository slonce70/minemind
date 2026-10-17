#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const webBundleDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const soundsDir = path.join(rootDir, 'assets', 'sounds');

export const maxWebEntryBundleBytes = 4.5 * 1024 * 1024;
// The question bank loads as its own chunk after the entry (content-loader.web.ts).
export const maxQuestionBankChunkBytes = 4 * 1024 * 1024;
export const maxWebExportBytes = 8 * 1024 * 1024;
export const maxSoundsBytes = 1 * 1024 * 1024;

async function directorySizeBytes(directoryPath) {
  let total = 0;
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      total += await directorySizeBytes(entryPath);
      continue;
    }

    if (entry.isFile()) {
      total += (await stat(entryPath)).size;
    }
  }

  return total;
}

async function findWebBundle(prefix, label) {
  const files = await readdir(webBundleDir);
  const bundleFiles = files.filter((file) => file.startsWith(prefix) && file.endsWith('.js'));

  if (bundleFiles.length !== 1) {
    throw new Error(`Expected exactly one ${label}, found ${bundleFiles.length}.`);
  }

  return path.join(webBundleDir, bundleFiles[0]);
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function assertWithinBudget(label, actualBytes, maxBytes) {
  if (actualBytes <= maxBytes) {
    return;
  }

  throw new Error(`${label} is ${formatMiB(actualBytes)}, above budget ${formatMiB(maxBytes)}.`);
}

try {
  const webEntryBundle = await findWebBundle('entry-', 'web JS entry bundle');
  const webEntryBundleBytes = (await stat(webEntryBundle)).size;
  const bankChunk = await findWebBundle('minecraft-question-bank-', 'question bank chunk');
  const bankChunkBytes = (await stat(bankChunk)).size;
  const webExportBytes = await directorySizeBytes(distDir);
  const soundsBytes = await directorySizeBytes(soundsDir);

  assertWithinBudget('Web entry bundle', webEntryBundleBytes, maxWebEntryBundleBytes);
  assertWithinBudget('Question bank chunk', bankChunkBytes, maxQuestionBankChunkBytes);
  assertWithinBudget('Web export', webExportBytes, maxWebExportBytes);
  assertWithinBudget('Sounds and music', soundsBytes, maxSoundsBytes);

  console.log(
    [
      `Web entry bundle: ${formatMiB(webEntryBundleBytes)} / ${formatMiB(maxWebEntryBundleBytes)}`,
      `Question bank chunk: ${formatMiB(bankChunkBytes)} / ${formatMiB(maxQuestionBankChunkBytes)}`,
      `Web export: ${formatMiB(webExportBytes)} / ${formatMiB(maxWebExportBytes)}`,
      `Sounds and music: ${formatMiB(soundsBytes)} / ${formatMiB(maxSoundsBytes)}`,
    ].join('\n')
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Web export budget check failed: ${message}`);
  process.exit(1);
}
