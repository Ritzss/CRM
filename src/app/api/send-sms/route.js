import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req) {
  try {
    const { to, body } = await req.json();
    if (!to || !body) return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({ body, from: process.env.TWILIO_FROM, to });
    return NextResponse.json({ sid: message.sid });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
