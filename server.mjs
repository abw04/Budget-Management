import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer(async (request, response) => {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const file = normalize(join(root, requested));
  if (!file.startsWith(root)) {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  try {
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(contents);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
}).listen(port, () => console.log(`Budget Execution running at http://localhost:${port}`));
