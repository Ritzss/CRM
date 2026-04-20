import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 });
    }

    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_FROM;

    if (!sid || !token || !from) {
      return NextResponse.json({ error: 'Twilio credentials not configured in .env.local' }, { status: 500 });
    }

    const client  = twilio(sid, token);
    const message = await client.messages.create({ body, from, to });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err) {
    const msg = err?.message || 'Unknown error';
    console.error('[send-sms]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
