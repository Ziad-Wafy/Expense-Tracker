import 'dotenv/config';
import { createServer as createHttpServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
const model = 'openai/gpt-oss-20b';
const maxBodyBytes = 128 * 1024;
const maxMessages = 20;
const maxMessageLength = 6000;

function respond(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.status = 400;
    throw error;
  }
}

function validateMessages(payload) {
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0 || payload.messages.length > maxMessages) {
    return null;
  }

  const messages = [];
  for (const message of payload.messages) {
    if (
      !message ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      message.content.trim().length === 0 ||
      message.content.length > maxMessageLength
    ) {
      return null;
    }
    messages.push({ role: message.role, content: message.content.trim() });
  }
  return messages;
}

export function createServer({ apiKey = process.env.GROQ_API_KEY, fetchImpl = fetch } = {}) {
  return createHttpServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/api/health' && request.method === 'GET') {
      respond(response, 200, { status: 'ok', groqConfigured: Boolean(apiKey) });
      return;
    }
    if (pathname !== '/api/chat') {
      respond(response, 404, { error: 'Endpoint not found.' });
      return;
    }
    if (request.method !== 'POST') {
      response.setHeader('allow', 'POST');
      respond(response, 405, { error: 'Method not allowed.' });
      return;
    }
    if (!apiKey) {
      respond(response, 503, { error: 'Groq is not configured. Add GROQ_API_KEY to .env and restart the app.' });
      return;
    }

    let messages;
    try {
      messages = validateMessages(await readJson(request));
    } catch (error) {
      respond(response, error.status ?? 400, { error: error.message });
      return;
    }
    if (!messages) {
      respond(response, 400, { error: 'Provide between 1 and 20 valid chat messages.' });
      return;
    }

    try {
      const groqResponse = await fetchImpl(groqUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are Ledgerly, a friendly personal spending assistant. Give clear, practical budgeting and expense-tracking guidance. Do not claim to access the user’s accounts or financial data unless they provide it in chat. Do not present yourself as a licensed financial advisor.',
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!groqResponse.ok) {
        console.error(`Groq request failed with HTTP ${groqResponse.status}.`);
        respond(response, 502, {
          error: groqResponse.status === 401 || groqResponse.status === 403
            ? 'Groq rejected the API key. Check GROQ_API_KEY in .env.'
            : groqResponse.status === 404
              ? 'The configured Groq model is unavailable. Check the model setting in server.mjs.'
            : 'Groq could not complete the request. Please try again.',
        });
        return;
      }

      const result = await groqResponse.json();
      const reply = result?.choices?.[0]?.message?.content;
      if (typeof reply !== 'string' || !reply.trim()) {
        console.error('Groq response did not include a chat message.');
        respond(response, 502, { error: 'Groq returned an empty response. Please try again.' });
        return;
      }
      respond(response, 200, { reply: reply.trim() });
    } catch (error) {
      const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
      console.error(timedOut ? 'Groq request timed out.' : 'Unable to reach Groq.', error.message);
      respond(response, timedOut ? 504 : 502, {
        error: timedOut
          ? 'Groq took too long to respond. Please try again.'
          : 'Unable to reach Groq. Check your internet connection and try again.',
      });
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.API_PORT ?? 3001);
  const server = createServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Ledgerly Groq API listening on http://127.0.0.1:${port}`);
    if (!process.env.GROQ_API_KEY) console.warn('GROQ_API_KEY is not set; chat requests will return a configuration error.');
  });
}
