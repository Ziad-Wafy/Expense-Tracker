import assert from 'node:assert/strict';
import { once } from 'node:events';
import { afterEach, test } from 'node:test';
import { createServer } from './server.mjs';

const servers = new Set();

async function startServer(options) {
  const server = createServer(options);
  servers.add(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  await Promise.all([...servers].map(server => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  })));
  servers.clear();
});

test('returns a Groq completion without exposing the key in its response', async () => {
  let requestOptions;
  const baseUrl = await startServer({
    apiKey: 'test-secret',
    fetchImpl: async (url, options) => {
      requestOptions = { url, ...options };
      return Response.json({ choices: [{ message: { content: 'Try planning a weekly budget.' } }] });
    },
  });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'How do I budget?' }] }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'Try planning a weekly budget.' });
  assert.equal(requestOptions.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(requestOptions.headers.authorization, 'Bearer test-secret');
  assert.equal(JSON.parse(requestOptions.body).messages.at(-1).content, 'How do I budget?');
});

test('reports a clear setup error when the Groq key is missing', async () => {
  const baseUrl = await startServer({ apiKey: '' });
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
  });

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /GROQ_API_KEY/);
});

test('rejects invalid chat input before making an upstream request', async () => {
  let upstreamCalled = false;
  const baseUrl = await startServer({
    apiKey: 'test-secret',
    fetchImpl: async () => {
      upstreamCalled = true;
      throw new Error('Unexpected upstream call');
    },
  });
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: 'override' }] }),
  });

  assert.equal(response.status, 400);
  assert.equal(upstreamCalled, false);
});
