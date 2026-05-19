import type { APIRoute } from 'astro';
import { JWT } from 'google-auth-library';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHEET_TAB = 'Subscribers';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let cachedClient: JWT | null = null;

function getClient(): JWT {
  if (cachedClient) return cachedClient;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
  let creds: ServiceAccount;
  try {
    creds = JSON.parse(raw);
  } catch (err) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ${(err as Error).message}`);
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }
  cachedClient = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });
  return cachedClient;
}

async function getAccessToken(): Promise<string> {
  const client = getClient();
  const res = await client.getAccessToken();
  if (!res.token) throw new Error('Google auth returned no access token');
  return res.token;
}

async function readExistingEmails(spreadsheetId: string, token: string): Promise<Set<string>> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId,
  )}/values/${encodeURIComponent(`${SHEET_TAB}!B:B`)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sheets read failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  const set = new Set<string>();
  for (const row of data.values ?? []) {
    const cell = row[0];
    if (cell) set.add(cell.toLowerCase().trim());
  }
  return set;
}

async function appendRow(
  spreadsheetId: string,
  token: string,
  timestamp: string,
  email: string,
): Promise<void> {
  const range = `${SHEET_TAB}!A:B`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [[timestamp, email]] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sheets append failed: ${res.status} ${body}`);
  }
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

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.error('GOOGLE_SHEETS_ID is not set. Email not saved:', email);
    if (asJson) {
      return jsonResponse(500, {
        ok: false,
        message: 'Signups are temporarily down. Try again shortly.',
      });
    }
    return redirectResponse('/?subscribed=error#signup');
  }

  try {
    const token = await getAccessToken();
    const existing = await readExistingEmails(spreadsheetId, token);
    const dup = existing.has(email.toLowerCase());
    if (!dup) {
      await appendRow(spreadsheetId, token, new Date().toISOString(), email);
    }
    if (asJson) {
      return jsonResponse(200, { ok: true, alreadySubscribed: dup });
    }
    return redirectResponse('/?subscribed=ok#signup');
  } catch (err) {
    // Log with the email so the address can be recovered from Railway logs
    // if the Sheets API is temporarily unavailable.
    console.error('Subscribe handler failed for', email, err);
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
