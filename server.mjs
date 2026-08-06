import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const publicFiles = new Set(['/index.html', '/src/main.js', '/src/domain/store.js', '/src/styles.css']);

function publicFileForPath(pathname) {
  if (!publicFiles.has(pathname)) return null;
  const file = resolve(root, pathname.slice(1));
  const relativePath = relative(root, file);
  if (!relativePath || isAbsolute(relativePath) || relativePath.startsWith('..')) return null;
  return file;
}

export function createAppServer() {
  return createServer(async (request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400); response.end('Bad request'); return;
    }
    if (pathname === '/') pathname = '/index.html';
    const file = publicFileForPath(pathname);
    if (!file) { response.writeHead(404); response.end('Not found'); return; }
    try {
      const contents = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(contents);
    } catch {
      response.writeHead(404); response.end('Not found');
    }
  });
}

function listen(server, port) {
  return new Promise((resolveReady, reject) => {
    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolveReady();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

export async function startServer(preferredPort = 4173) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const port = preferredPort + attempt;
    const server = createAppServer();
    try {
      await listen(server, port);
      return { server, port: server.address().port };
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error;
    }
  }
  throw new Error(`Could not find an available port starting at ${preferredPort}.`);
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === resolve(fileURLToPath(import.meta.url)).toLowerCase()) {
  startServer(Number(process.env.PORT || 4173))
    .then(({ port }) => console.log(`Budget Execution running at http://localhost:${port}`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
