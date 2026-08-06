import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const mainSource = readFileSync(fileURLToPath(new URL('../src/main.js', import.meta.url)), 'utf8');

test('New Request renders its actions through the modal footer contract', () => {
  const renderFunction = mainSource.match(/function renderNewRequestModal\(\) \{[\s\S]*?\n\}/)?.[0];

  assert.ok(renderFunction, 'renderNewRequestModal should remain available');
  assert.ok(renderFunction.includes('</form>`}`, canCreate ?'));
  assert.doesNotMatch(renderFunction, /<\/form>`\}\$\{canCreate \?/);
});
