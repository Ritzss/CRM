import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'FAST2SMS_API_KEY not set in .env.local' }, { status: 500 });
    }

    // Strip +91 or 91 prefix — Fast2SMS expects 10-digit Indian numbers only
    const cleanNumber = to.replace(/^\+91/, '').replace(/^91/, '').trim();

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',           // Quick transactional route — no DLT needed for testing
        message: body,
        numbers: cleanNumber,
        flash: '0',
      }),
    });

    const data = await res.json();

    if (!data.return) {
      return NextResponse.json({ error: data.message || 'Fast2SMS send failed', detail: data }, { status: 400 });
    }

    return NextResponse.json({ success: true, requestId: data.request_id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
