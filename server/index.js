import http from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  getDaily,
  getPreferences,
  getRecord,
  initializeStore,
  listDaily,
  listRecords,
  removeRecord,
  saveDaily,
  savePreferences,
  saveRecord,
} from './file-store.js';

const port = Number(process.env.PORT || 3131);
const maxBodySize = 10 * 1024 * 1024;

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodySize) {
      const error = new Error('Request body is too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function collectionRoute(pathname) {
  const match = pathname.match(/^\/(problems|adhocProblems|notes)(?:\/([^/]+))?$/);
  if (!match) return null;
  return {
    name: match[1],
    id: match[2] ? decodeURIComponent(match[2]) : null,
  };
}

async function handleCollection(request, response, route) {
  if (request.method === 'GET' && !route.id) {
    return sendJson(response, 200, await listRecords(route.name));
  }

  if (request.method === 'GET' && route.id) {
    const record = await getRecord(route.name, route.id);
    return record
      ? sendJson(response, 200, record)
      : sendJson(response, 404, { error: 'Record not found' });
  }

  if (request.method === 'POST' && !route.id) {
    const input = await readJson(request);
    const record = await saveRecord(route.name, {
      ...input,
      id: input.id || randomUUID(),
    });
    return sendJson(response, 201, record);
  }

  if (request.method === 'PUT' && route.id) {
    const input = await readJson(request);
    const record = await saveRecord(route.name, {
      ...input,
      id: input.id ?? route.id,
    });
    return sendJson(response, 200, record);
  }

  if (request.method === 'DELETE' && route.id) {
    const removed = await removeRecord(route.name, route.id);
    return sendJson(response, removed ? 200 : 404, {});
  }

  return sendJson(response, 405, { error: 'Method not allowed' });
}

async function handleDaily(request, response, pathname) {
  const match = pathname.match(/^\/daily(?:\/([^/]+))?$/);
  if (!match) return false;
  const id = match[1] ? decodeURIComponent(match[1]) : null;

  if (request.method === 'GET' && !id) {
    sendJson(response, 200, await listDaily());
    return true;
  }

  if (request.method === 'GET' && id) {
    const record = await getDaily(id);
    sendJson(response, record ? 200 : 404, record || { error: 'Daily record not found' });
    return true;
  }

  if (request.method === 'POST' && !id) {
    const input = await readJson(request);
    if (!input.id) {
      sendJson(response, 400, { error: 'Daily record id is required' });
      return true;
    }
    sendJson(response, 201, await saveDaily(input));
    return true;
  }

  if (request.method === 'PUT' && id) {
    const input = await readJson(request);
    sendJson(response, 200, await saveDaily({ ...input, id }));
    return true;
  }

  sendJson(response, 405, { error: 'Method not allowed' });
  return true;
}

async function handlePreferences(request, response, pathname) {
  if (pathname !== '/preferences/user') return false;

  if (request.method === 'GET') {
    sendJson(response, 200, await getPreferences());
    return true;
  }

  if (request.method === 'PUT') {
    const input = await readJson(request);
    sendJson(response, 200, await savePreferences({ ...input, id: 'user' }));
    return true;
  }

  sendJson(response, 405, { error: 'Method not allowed' });
  return true;
}

await initializeStore();

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const route = collectionRoute(pathname);
    if (route) {
      await handleCollection(request, response, route);
      return;
    }

    if (await handleDaily(request, response, pathname)) return;
    if (await handlePreferences(request, response, pathname)) return;

    sendJson(response, 404, { error: 'Route not found' });
  } catch (error) {
    console.error(error);
    sendJson(response, error.status || 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Phenomenal Grind file API listening on http://127.0.0.1:${port}`);
});
