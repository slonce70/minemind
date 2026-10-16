import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rootDir = new URL('..', import.meta.url).pathname;

function tsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      return tsxFiles(fullPath);
    }

    return fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

const sources = [...tsxFiles(path.join(rootDir, 'app')), ...tsxFiles(path.join(rootDir, 'src'))].map((file) => ({
  file: path.relative(rootDir, file),
  source: readFileSync(file, 'utf8'),
}));

function elements(source: string, tag: string) {
  return [...source.matchAll(new RegExp(`<${tag}\\b([\\s\\S]*?)/?>`, 'g'))].map((match) => match[1]);
}

test('every pressable tells screen readers what kind of control it is', () => {
  for (const { file, source } of sources) {
    for (const props of elements(source, 'Pressable')) {
      assert.match(props, /accessibilityRole=/, `${file}: Pressable without accessibilityRole`);
    }
  }
});

test('every text field has an accessible name', () => {
  for (const { file, source } of sources) {
    for (const props of elements(source, 'TextInput')) {
      assert.match(props, /accessibilityLabel=/, `${file}: TextInput without accessibilityLabel`);
    }
  }
});

test('answers and results never rely on colour alone', () => {
  const parts = readFileSync(path.join(rootDir, 'src/features/quiz/question-parts.tsx'), 'utf8');
  const results = readFileSync(path.join(rootDir, 'src/features/results/results-view.tsx'), 'utf8');

  assert.match(parts, /state === 'correct' \? 'check' : state === 'wrong' \? 'cross'/);
  assert.match(results, /name=\{entry\.isCorrect \? 'check' : 'cross'\}/);
});
