import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(req) {
  try {
    const { to, subject, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const from   = process.env.SENDGRID_FROM;

    if (!apiKey) return NextResponse.json({ error: 'SENDGRID_API_KEY not set in .env.local' }, { status: 500 });
    if (!from)   return NextResponse.json({ error: 'SENDGRID_FROM not set in .env.local' }, { status: 500 });

    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to, from,
      subject: subject || 'Delivery Update',
      text: body,
      html: `<p style="font-family:sans-serif;line-height:1.6">${body.replace(/\n/g,'<br>')}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err?.response?.body?.errors?.[0]?.message || err?.message || 'Unknown error';
    console.error('[send-email]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
