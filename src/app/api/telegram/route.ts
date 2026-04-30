import { NextRequest, NextResponse } from 'next/server';
import { loadUserFromSupabase, resetUser, resetActiveCalories } from '@/lib/user-store';
import { syncAirtableToSupabase } from '@/lib/airtable';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL;

function getBaseUrl(request: NextRequest): string {
  if (SITE_URL) return SITE_URL.replace(/\/$/, '');
  const host  = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

async function sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options,
    }),
  });
}

const mainKeyboard = {
  keyboard: [
    ['📊 Statistiche'],
  ],
  resize_keyboard: true,
  persistent: true,
};

export async function POST(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  try {
    const update = await request.json();

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text || '';
      const firstName = message.from.first_name || 'User';

      if (text === '/start') {
        await sendMessage(
          chatId,
          `Ciao ${firstName}! 👋\n\nBenvenuto nel tuo assistente nutrizionale.\n\nClicca il bottone qui sotto per vedere il tuo progresso.`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '/reset') {
        await loadUserFromSupabase(userId, firstName);
        await resetUser(userId);
        await sendMessage(
          chatId,
          `🔄 *Giornata azzerata!*\n\nTutti i dati di oggi sono stati resettati.`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '/reset-active') {
        await resetActiveCalories(userId);
        await sendMessage(
          chatId,
          `🔄 *Calorie attive azzerate!*\n\nLe calorie attive e le attività sono state resettate a 0.`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '/sync') {
        await sendMessage(chatId, '🔄 *Sincronizzazione Airtable in corso...*', { reply_markup: mainKeyboard });
        try {
          await syncAirtableToSupabase();
          await sendMessage(chatId, '✅ *Sincronizzazione completata con successo!*', { reply_markup: mainKeyboard });
        } catch (err: any) {
          await sendMessage(chatId, `❌ *Errore durante la sincronizzazione:*\n${err.message}`, { reply_markup: mainKeyboard });
        }
        return NextResponse.json({ ok: true });
      }

      if (text === '📊 Statistiche') {
        const progressoUrl = `${baseUrl}/progresso?userId=${userId}`;
        await sendMessage(
          chatId,
          `📊 *Tuo Progresso*\n\nClicca il bottone per aprire la tua pagina di progresso 👇`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '📊 Apri Tuo Progresso', url: progressoUrl },
              ]],
            },
          }
        );
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        `Usa il bottone *📊 Statistiche* per vedere il tuo progresso!`,
        { reply_markup: mainKeyboard }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint ready' });
}
