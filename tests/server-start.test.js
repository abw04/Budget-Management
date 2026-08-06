import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

test('dev server falls back when the preferred port is already occupied', async (t) => {
  const blocker = createServer((request, response) => response.end('occupied'));
  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const preferredPort = blocker.address().port;
  t.after(() => blocker.close());

  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(preferredPort) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());

  const output = await new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`server did not start: ${stdout}${stderr}`)), 4_000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.includes('Budget Execution running at')) {
        clearTimeout(timeout);
        resolve(stdout);
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    child.on('exit', (code) => {
      if (code !== null && !stdout.includes('Budget Execution running at')) {
        clearTimeout(timeout);
        reject(new Error(`server exited with ${code}: ${stdout}${stderr}`));
      }
    });
  });

  const port = Number(output.match(/http:\/\/localhost:(\d+)/)?.[1]);
  assert.ok(port > preferredPort && port <= preferredPort + 19);
});

test('dev server exposes only the public application files', async (t) => {
  const { server, port } = await startServer(0);
  t.after(() => server.close());
  const get = (path) => fetch(`http://127.0.0.1:${port}${path}`);

  assert.equal((await get('/')).status, 200);
  assert.equal((await get('/src/main.js')).status, 200);
  assert.equal((await get('/PRD.md')).status, 404);
  assert.equal((await get('/.git/HEAD')).status, 404);
  assert.equal((await get('/%2e%2e/PRD.md')).status, 404);
  assert.equal((await get('/unknown.js')).status, 404);
});
