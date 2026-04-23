export async function register() {
  // Only run on the Node.js runtime (server), not in the edge runtime
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!siteUrl || !botToken) return;

  const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/telegram`;

  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      }
    );
    console.log(`[instrumentation] Telegram webhook registered: ${webhookUrl}`);
  } catch (err) {
    console.error('[instrumentation] Failed to register Telegram webhook:', err);
  }
}
