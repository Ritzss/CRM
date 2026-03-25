import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing to or body' }, { status: 400 });
    }

    const token       = process.env.META_WHATSAPP_TOKEN;
    const phoneNumId  = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumId) {
      return NextResponse.json({
        error: 'Missing META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID in .env.local'
      }, { status: 500 });
    }

    // Strip any non-digit chars except leading +
    const cleanTo = to.replace(/[\s\-()]/g, '');

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { preview_url: false, body },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Meta API error', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, messageId: data?.messages?.[0]?.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
