import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  }

  // Always prefer the fixed production URL so the webhook survives session changes
  let baseUrl: string;
  if (SITE_URL) {
    baseUrl = SITE_URL.replace(/\/$/, '');
  } else {
    const host  = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    baseUrl = `${proto}://${host}`;
  }

  const webhookUrl = `${baseUrl}/api/telegram`;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    }
  );

  const data = await res.json();
  return NextResponse.json({ ok: data.ok, webhookUrl, telegram: data });
}
