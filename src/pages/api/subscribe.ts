import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FILE = './data/subscribers.csv';
const CSV_HEADER = 'timestamp,email\n';

function getFilePath(): string {
  return process.env.SUBSCRIBERS_FILE || DEFAULT_FILE;
}

function csvEscape(value: string): string {
  return /[,"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else if (ch === '"' && cur === '') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function ensureFile(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  try {
    await fs.access(path);
  } catch {
    await fs.writeFile(path, CSV_HEADER, 'utf8');
  }
}

async function alreadySubscribed(path: string, email: string): Promise<boolean> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf8');
  } catch {
    return false;
  }
  const needle = email.toLowerCase();
  const lines = content.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = parseCsvRow(line);
    if (cols[1] && cols[1].toLowerCase() === needle) return true;
  }
  return false;
}

async function appendSubscriber(path: string, email: string): Promise<void> {
  const row = `${new Date().toISOString()},${csvEscape(email)}\n`;
  await fs.appendFile(path, row, 'utf8');
}

async function readEmail(request: Request): Promise<string | null> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as { email?: unknown };
      return typeof body.email === 'string' ? body.email.trim() : null;
    } catch {
      return null;
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    const value = form.get('email');
    return typeof value === 'string' ? value.trim() : null;
  }

  return null;
}

function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function redirectResponse(url: string): Response {
  return new Response(null, { status: 303, headers: { location: url } });
}

export const POST: APIRoute = async ({ request }) => {
  const email = await readEmail(request);
  const asJson = wantsJson(request);

  if (!email || !EMAIL_RE.test(email)) {
    if (asJson) {
      return jsonResponse(400, { ok: false, message: 'That email address looks off.' });
    }
    return redirectResponse('/?subscribed=invalid#signup');
  }

  const path = getFilePath();

  try {
    await ensureFile(path);
    const dup = await alreadySubscribed(path, email);
    if (!dup) {
      await appendSubscriber(path, email);
    }
    if (asJson) {
      return jsonResponse(200, { ok: true, alreadySubscribed: dup });
    }
    return redirectResponse('/?subscribed=ok#signup');
  } catch (err) {
    console.error('Subscribe handler failed', err);
    if (asJson) {
      return jsonResponse(500, {
        ok: false,
        message: "Couldn't save that just now. Try again in a minute?",
      });
    }
    return redirectResponse('/?subscribed=error#signup');
  }
};

export const GET: APIRoute = () => {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
};
