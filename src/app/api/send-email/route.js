import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(req) {
  try {
    const { to, subject, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const from   = process.env.SENDGRID_FROM;

    if (!apiKey) return NextResponse.json({ error: 'SENDGRID_API_KEY is not set in .env.local' }, { status: 500 });
    if (!from)   return NextResponse.json({ error: 'SENDGRID_FROM is not set in .env.local' }, { status: 500 });

    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to,
      from,
      subject: subject || 'Delivery Update',
      text: body,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    // SendGrid errors contain the full response body — extract it
    const sgError = err?.response?.body?.errors?.[0]?.message || err.message;
    console.error('SendGrid error:', JSON.stringify(err?.response?.body || err.message));
    return NextResponse.json({ error: sgError }, { status: 500 });
  }
}
