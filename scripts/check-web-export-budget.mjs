#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const webBundleDir = path.join(distDir, '_expo', 'static', 'js', 'web');
const assetIllustrationsDir = path.join(rootDir, 'assets', 'question-illustrations');
const publicIllustrationsDir = path.join(rootDir, 'public', 'question-illustrations');

export const maxWebEntryBundleBytes = 4.5 * 1024 * 1024;
export const maxWebExportBytes = 21 * 1024 * 1024;
export const maxQuestionIllustrationsBytes = 8 * 1024 * 1024;

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

async function findWebEntryBundle() {
  const files = await readdir(webBundleDir);
  const bundleFiles = files.filter((file) => file.endsWith('.js'));

  if (bundleFiles.length !== 1) {
    throw new Error(`Expected exactly one web JS entry bundle, found ${bundleFiles.length}.`);
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
  const webEntryBundle = await findWebEntryBundle();
  const webEntryBundleBytes = (await stat(webEntryBundle)).size;
  const webExportBytes = await directorySizeBytes(distDir);
  const assetIllustrationsBytes = await directorySizeBytes(assetIllustrationsDir);
  const publicIllustrationsBytes = await directorySizeBytes(publicIllustrationsDir);

  assertWithinBudget('Web entry bundle', webEntryBundleBytes, maxWebEntryBundleBytes);
  assertWithinBudget('Web export', webExportBytes, maxWebExportBytes);
  assertWithinBudget('Asset question illustrations', assetIllustrationsBytes, maxQuestionIllustrationsBytes);
  assertWithinBudget('Public question illustrations', publicIllustrationsBytes, maxQuestionIllustrationsBytes);

  if (assetIllustrationsBytes !== publicIllustrationsBytes) {
    throw new Error(
      `Question illustration mirrors differ: assets ${formatMiB(assetIllustrationsBytes)}, public ${formatMiB(
        publicIllustrationsBytes
      )}.`
    );
  }

  console.log(
    [
      `Web entry bundle: ${formatMiB(webEntryBundleBytes)} / ${formatMiB(maxWebEntryBundleBytes)}`,
      `Web export: ${formatMiB(webExportBytes)} / ${formatMiB(maxWebExportBytes)}`,
      `Question illustrations: ${formatMiB(assetIllustrationsBytes)} / ${formatMiB(
        maxQuestionIllustrationsBytes
      )}`,
    ].join('\n')
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Web export budget check failed: ${message}`);
  process.exit(1);
}
