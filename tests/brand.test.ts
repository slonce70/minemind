import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { progressResources } from '../src/i18n/progress-resources';
import { resources } from '../src/i18n/resources';

// Store rules and Mojang's usage guidelines: the game's name may appear only in the disclaimer.
const trademark = /minecraft|майнкрафт|mojang/i;

function strings(value: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof value === 'string') {
    return [[path.join('.'), value]];
  }

  return value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => strings(child, [...path, key]))
    : [];
}

test('the trademark appears in app copy only inside the disclaimer', () => {
  const offenders = strings({ progressResources, resources }).filter(
    ([path, text]) => trademark.test(text) && !path.endsWith('.disclaimer')
  );

  assert.deepEqual(offenders, []);
});

test('app name, slug and questions stay free of the trademark', () => {
  const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-question-bank.v1.json', import.meta.url), 'utf8')
  ) as Array<{ explanation: Record<string, string>; id: string; options: Array<Record<string, string>>; prompt: Record<string, string> }>;

  assert.ok(!trademark.test(`${app.name} ${app.slug} ${app.scheme}`));
  assert.deepEqual(
    bank.filter((record) => trademark.test(JSON.stringify([record.prompt, record.options, record.explanation]))).map((record) => record.id),
    []
  );
});
