import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';

export const prerender = false;

const DEFAULT_FILE = './data/contact-messages.csv';
const EMPTY_CSV = 'timestamp,name,email,message\n';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const GET: APIRoute = async ({ url, request }) => {
  const expected = process.env.CONTACT_DOWNLOAD_TOKEN;
  if (!expected) {
    return new Response(
      'Download disabled. Set CONTACT_DOWNLOAD_TOKEN to enable this endpoint.',
      { status: 503 },
    );
  }

  const headerToken = request.headers.get('x-contact-token') || '';
  const queryToken = url.searchParams.get('token') || '';
  const provided = headerToken || queryToken;

  if (!provided || !safeEqual(provided, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const path = process.env.CONTACT_FILE || DEFAULT_FILE;
  let body: string;
  try {
    body = await fs.readFile(path, 'utf8');
  } catch {
    body = EMPTY_CSV;
  }

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="contact-messages.csv"',
      'cache-control': 'no-store',
    },
  });
};
