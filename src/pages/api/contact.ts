import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FILE = './data/contact-messages.csv';
const CSV_HEADER = 'timestamp,name,email,message\n';
const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_MESSAGE = 5000;

function getFilePath(): string {
  return process.env.CONTACT_FILE || DEFAULT_FILE;
}

function csvEscape(value: string): string {
  return /[,"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function ensureFile(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  try {
    await fs.access(path);
  } catch {
    await fs.writeFile(path, CSV_HEADER, 'utf8');
  }
}

async function appendMessage(
  path: string,
  name: string,
  email: string,
  message: string,
): Promise<void> {
  const row = `${new Date().toISOString()},${csvEscape(name)},${csvEscape(email)},${csvEscape(message)}\n`;
  await fs.appendFile(path, row, 'utf8');
}

type ContactInput = { name: string; email: string; message: string } | null;

async function readInput(request: Request): Promise<ContactInput> {
  const contentType = request.headers.get('content-type') || '';

  const pick = (raw: unknown): string =>
    typeof raw === 'string' ? raw.trim() : '';

  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      return { name: pick(body.name), email: pick(body.email), message: pick(body.message) };
    } catch {
      return null;
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    return {
      name: pick(form.get('name')),
      email: pick(form.get('email')),
      message: pick(form.get('message')),
    };
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

function validate(input: ContactInput): { ok: true; data: { name: string; email: string; message: string } } | { ok: false; message: string } {
  if (!input) return { ok: false, message: "Couldn't read the submission." };
  const { name, email, message } = input;
  if (!name || name.length > MAX_NAME) return { ok: false, message: 'A name helps.' };
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { ok: false, message: 'That email address looks off.' };
  }
  if (!message || message.length > MAX_MESSAGE) {
    return { ok: false, message: 'A short note about what you have in mind helps.' };
  }
  return { ok: true, data: { name, email, message } };
}

export const POST: APIRoute = async ({ request }) => {
  const asJson = wantsJson(request);
  const input = await readInput(request);
  const result = validate(input);

  if (!result.ok) {
    if (asJson) {
      return jsonResponse(400, { ok: false, message: result.message });
    }
    return redirectResponse('/?contact=invalid#contact');
  }

  const path = getFilePath();

  try {
    await ensureFile(path);
    await appendMessage(path, result.data.name, result.data.email, result.data.message);
    if (asJson) {
      return jsonResponse(200, { ok: true });
    }
    return redirectResponse('/?contact=ok#contact');
  } catch (err) {
    console.error('Contact handler failed', err);
    if (asJson) {
      return jsonResponse(500, {
        ok: false,
        message: "Couldn't save that just now. Try again in a minute?",
      });
    }
    return redirectResponse('/?contact=error#contact');
  }
};

export const GET: APIRoute = () => {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
};
