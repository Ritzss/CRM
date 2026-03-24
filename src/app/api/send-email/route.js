import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(req) {
  try {
    const { to, subject, body } = await req.json();
    if (!to || !body) return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({ to, from: process.env.SENDGRID_FROM, subject: subject || 'Delivery Update', text: body });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
