import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const POST: APIRoute = async ({ request, redirect }) => {
  const apiKey = import.meta.env.BUTTONDOWN_API_KEY ?? process.env.BUTTONDOWN_API_KEY;

  const email = await readEmail(request);
  const asJson = wantsJson(request);

  if (!email || !EMAIL_RE.test(email)) {
    if (asJson) {
      return jsonResponse(400, { ok: false, message: 'That email address looks off.' });
    }
    return redirect('/?subscribed=invalid#signup', 303);
  }

  if (!apiKey) {
    console.error('BUTTONDOWN_API_KEY is not set.');
    if (asJson) {
      return jsonResponse(500, {
        ok: false,
        message: 'Signups are temporarily down. Try again shortly.',
      });
    }
    return redirect('/?subscribed=error#signup', 303);
  }

  try {
    const res = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    });

    if (res.ok || res.status === 201) {
      if (asJson) return jsonResponse(200, { ok: true });
      return redirectResponse('/?subscribed=ok#signup');
    }

    // Buttondown returns 400 for already-subscribed in some cases.
    // Treat duplicates as success from the user's perspective.
    let payload: { detail?: string; code?: string } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      /* ignore */
    }

    const detail = (payload.detail || '').toLowerCase();
    const code = (payload.code || '').toLowerCase();
    const alreadySubscribed =
      res.status === 400 &&
      (detail.includes('already') || code.includes('already') || code.includes('exists'));

    if (alreadySubscribed) {
      if (asJson) return jsonResponse(200, { ok: true, alreadySubscribed: true });
      return redirectResponse('/?subscribed=ok#signup');
    }

    console.error('Buttondown error', res.status, payload);
    if (asJson) {
      return jsonResponse(502, {
        ok: false,
        message: "Couldn't reach the mailing list service. Try again in a minute?",
      });
    }
    return redirectResponse('/?subscribed=error#signup');
  } catch (err) {
    console.error('Subscribe handler failed', err);
    if (asJson) {
      return jsonResponse(500, {
        ok: false,
        message: 'Something went sideways on our end.',
      });
    }
    return redirectResponse('/?subscribed=error#signup');
  }
};

export const GET: APIRoute = () => {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
};
