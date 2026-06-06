#!/usr/bin/env node
import { access, chmod } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(rootDir, 'android');
const gradlewPath = path.join(androidDir, 'gradlew');

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: { ...process.env, CI: process.env.CI ?? '1' },
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

if (!(await exists(gradlewPath))) {
  console.log('android/gradlew not found; generating Android project with Expo prebuild.');
  await run('npx', ['expo', 'prebuild', '--platform', 'android', '--non-interactive']);
}

if (process.platform !== 'win32') {
  await chmod(gradlewPath, 0o755);
}

await run(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  [':app:installDebug', '-PreactNativeArchitectures=arm64-v8a', '--console=plain'],
  { cwd: androidDir }
);
