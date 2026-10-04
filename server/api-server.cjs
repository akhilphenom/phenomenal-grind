const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { FileStore } = require('./file-store.cjs');

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) reject(new Error('Request body is too large'));
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function collectionRoute(store, kind, method, id, body) {
  const items = store.readProblems(kind);
  if (method === 'GET' && !id) return { status: 200, body: items };
  if (method === 'POST' && !id) {
    const item = { ...body, id: String(body.id) };
    store.writeProblems([...items, item], kind);
    return { status: 201, body: item };
  }

  const index = items.findIndex((item) => String(item.id) === String(id));
  if (index < 0) return { status: 404, body: { error: 'Record not found' } };
  if (method === 'PUT') {
    const item = { ...body, id: String(id) };
    items[index] = item;
    store.writeProblems(items, kind);
    return { status: 200, body: item };
  }
  if (method === 'DELETE') {
    items.splice(index, 1);
    store.writeProblems(items, kind);
    return { status: 200, body: {} };
  }
  return null;
}

function serveStatic(response, staticDirectory, pathname) {
  if (!staticDirectory) return false;
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolved = path.resolve(staticDirectory, requested);
  const root = path.resolve(staticDirectory);
  const isInsideRoot = resolved === root || resolved.startsWith(`${root}${path.sep}`);
  const filePath = isInsideRoot && fs.existsSync(resolved) && fs.statSync(resolved).isFile()
    ? resolved
    : path.join(root, 'index.html');
  if (!fs.existsSync(filePath)) return false;
  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(response);
  return true;
}

function createApiServer({ dataDirectory, staticDirectory, logger = false }) {
  const store = new FileStore(dataDirectory);

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (segments[0] !== 'api') {
      if (!serveStatic(response, staticDirectory, url.pathname)) sendJson(response, 404, { error: 'Not found' });
      return;
    }

    try {
      const resource = segments[1];
      const id = segments[2];
      const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await readBody(request) : undefined;
      let result;

      if (resource === 'problems' || resource === 'adhocProblems') {
        result = collectionRoute(store, resource, request.method, id, body);
      } else if (resource === 'daily') {
        if (request.method === 'GET' && !id) result = { status: 200, body: store.listDaily() };
        else if (request.method === 'GET') {
          const daily = store.getDaily(id);
          result = daily ? { status: 200, body: daily } : { status: 404, body: { error: 'Day not found' } };
        } else if (request.method === 'PUT' || request.method === 'POST') {
          const dailyId = id || body.id;
          result = { status: id ? 200 : 201, body: store.saveDaily(dailyId, body) };
        }
      } else if (resource === 'notes') {
        if (request.method === 'GET' && !id) result = { status: 200, body: store.listNotes() };
        else if (request.method === 'POST' || request.method === 'PUT') {
          result = { status: request.method === 'POST' ? 201 : 200, body: store.saveNote({ ...body, id: id || body.id }) };
        } else if (request.method === 'DELETE') {
          store.deleteNote(id);
          result = { status: 200, body: {} };
        }
      } else if (resource === 'preferences' && id === 'user') {
        if (request.method === 'GET') result = { status: 200, body: store.getPreferences() };
        else if (request.method === 'PUT') result = { status: 200, body: store.savePreferences(body) };
      }

      if (!result) result = { status: 405, body: { error: 'Method not allowed' } };
      if (logger) console.log(`${request.method} ${url.pathname} ${result.status}`);
      sendJson(response, result.status, result.body);
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: error.message });
    }
  });
}

module.exports = { createApiServer };
