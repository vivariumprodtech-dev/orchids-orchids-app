import { NextRequest, NextResponse } from 'next/server';
import { loadUserFromSupabase, syncUserToSupabase, resetUser, resetActiveCalories, FOODS, ACTIVITIES, type UserData } from '@/lib/user-store';
import { syncAirtableToSupabase } from '@/lib/airtable';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3001';

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

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

async function editMessageText(chatId: number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

const mainKeyboard = {
  keyboard: [
    ['💧 Acqua', '🍽 Cibi frequenti', '🏃 Attività'],
    ['📊 Statistiche'],
  ],
  resize_keyboard: true,
  persistent: true,
};

function logFood(userData: UserData, foodName: string, grams: number) {
  const food = FOODS[foodName];
  const multiplier = grams / 100;
  const calories = Math.round(food.cal * multiplier);
  const protein = Math.round(food.pro * multiplier * 10) / 10;
  const carbs = Math.round(food.carb * multiplier * 10) / 10;
  const fats = Math.round(food.fat * multiplier * 10) / 10;
  const fiber = Math.round(food.fiber * multiplier * 10) / 10;

  userData.calories += calories;
  userData.protein += protein;
  userData.carbs += carbs;
  userData.fats += fats;
  userData.fiber += fiber;
  userData.foods.push({ name: foodName, grams, calories, protein, carbs, fats, fiber });
  userData.awaitingQuantity = null;

  return { calories, protein, carbs, fats, fiber };
}

function buildStatsUrl(userData: UserData, userId: number): string {
  return `${WEBAPP_URL}/progresso?userId=${userId}&_v=${Date.now()}`;
}

function buildFrequentFoodsUrl(userId: number): string {
  return `${WEBAPP_URL}/profile?userId=${userId}&_v=${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text || '';
      const firstName = message.from.first_name || 'User';
      
      // Load from Supabase
      const userData = await loadUserFromSupabase(userId, firstName);

      if (text === '/start') {
        await sendMessage(
          chatId,
          `Ciao ${firstName}! 👋\n\nBenvenuto nel tuo assistente nutrizionale.\n\nI tuoi dati verranno salvati in modo persistente.\n\nUsa i bottoni della tastiera qui sotto per loggare acqua, cibi e vedere le statistiche.`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '/reset') {
          await resetUser(userId);
          await sendMessage(
            chatId,
            `🔄 *Giornata azzerata!*\n\nTutti i dati di oggi sono stati resettati su Supabase.\n\nPuoi ricominciare a loggare.`,
            { reply_markup: mainKeyboard }
          );
          return NextResponse.json({ ok: true });
        }

        if (text === '/reset-active') {
          await resetActiveCalories(userId);
          await sendMessage(
            chatId,
            `🔄 *Calorie attive azzerate!*\n\nLe calorie attive e le attività sono state resettate a 0.\n\nI dati nutrizionali sono stati mantenuti.`,
            { reply_markup: mainKeyboard }
          );
          return NextResponse.json({ ok: true });
        }

        if (text === '/sync') {
          await sendMessage(chatId, "🔄 *Sincronizzazione Airtable in corso...*", { reply_markup: mainKeyboard });
          try {
            await syncAirtableToSupabase();
            await sendMessage(chatId, "✅ *Sincronizzazione completata con successo!*", { reply_markup: mainKeyboard });
          } catch (err: any) {
            await sendMessage(chatId, `❌ *Errore durante la sincronizzazione:*\n${err.message}`, { reply_markup: mainKeyboard });
          }
          return NextResponse.json({ ok: true });
        }

      if (userData.awaitingWater) {
          const ml = parseInt(text);
          if (isNaN(ml) || ml <= 0) {
            await sendMessage(chatId, '❌ Inserisci un numero valido di ml!', { reply_markup: mainKeyboard });
            return NextResponse.json({ ok: true });
          }
          userData.water += ml;
          userData.awaitingWater = false;
          await syncUserToSupabase(userId);
          await sendMessage(
            chatId,
            `💧 *Acqua aggiunta!*\n\nQuantità: ${ml}ml\n📊 Totale oggi: ${userData.water}ml (${(userData.water / 1000).toFixed(1)}L)`,
            { reply_markup: mainKeyboard }
          );
          return NextResponse.json({ ok: true });
        }

        if (userData.awaitingActivity) {
        const kcal = parseInt(text);
        if (isNaN(kcal) || kcal <= 0) {
          await sendMessage(chatId, '❌ Inserisci un numero valido di calorie!', { reply_markup: mainKeyboard });
          return NextResponse.json({ ok: true });
        }
        userData.activeCalories += kcal;
        userData.activities.push({ name: 'Attività personalizzata', kcal });
        userData.awaitingActivity = false;
        await syncUserToSupabase(userId);
        await sendMessage(
          chatId,
          `✅ *Attività loggata!*\n\n🏃 Attività personalizzata\nCalorie bruciate: ${kcal} kcal\n\n📊 *Totale calorie attive oggi:* ${userData.activeCalories} kcal`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

      if (userData.awaitingQuantity) {
        const grams = parseInt(text);
        if (isNaN(grams) || grams <= 0) {
          await sendMessage(chatId, '❌ Inserisci un numero valido di grammi!', { reply_markup: mainKeyboard });
          return NextResponse.json({ ok: true });
        }
        const foodName = userData.awaitingQuantity;
        const food = FOODS[foodName];
        const { calories } = logFood(userData, foodName, grams);
        await syncUserToSupabase(userId);
        await sendMessage(
          chatId,
          `✅ *Cibo loggato!*\n\n${food.emoji} ${foodName}\nQuantità: ${grams}g\nCalorie: ${calories} kcal\n\n📊 *Totale oggi:*\n🔥 ${userData.calories} kcal\n🥩 Proteine: ${userData.protein}g\n🍞 Carbs: ${userData.carbs}g\n🥑 Grassi: ${userData.fats}g\n🌾 Fibre: ${userData.fiber}g`,
          { reply_markup: mainKeyboard }
        );
        return NextResponse.json({ ok: true });
      }

if (text === '💧 Acqua') {
          userData.awaitingWater = true; // State is only in memory for current session
          await sendMessage(
            chatId,
            `💧 *Aggiungi Acqua*\n\nQuanta acqua vuoi loggare?`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '100ml', callback_data: 'water_100' },
                    { text: '200ml', callback_data: 'water_200' },
                    { text: '250ml', callback_data: 'water_250' },
                  ],
                  [
                    { text: '330ml', callback_data: 'water_330' },
                    { text: '500ml', callback_data: 'water_500' },
                    { text: '750ml', callback_data: 'water_750' },
                  ],
                  [
                    { text: '1L', callback_data: 'water_1000' },
                    { text: '✏️ Quantità libera', callback_data: 'water_custom' },
                  ],
                ],
              },
            }
          );
          return NextResponse.json({ ok: true });
        }

          if (text === '🍽 Cibi frequenti') {
            const frequentFoodsUrl = buildFrequentFoodsUrl(userId);
            await sendMessage(
              chatId,
              `🍽 *Cibi Frequenti*\n\nQuale cibo vuoi loggare?`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '🥛 Skyr Lidl', callback_data: 'food_Skyr Lidl' },
                      { text: '🥛 Yogurt Mevgal', callback_data: 'food_Yogurt Mevgal' },
                    ],
                    [
                      { text: '🍫 Cioccolato 78%', callback_data: 'food_Cioccolato 78%' },
                      { text: '🥖 Pane Proteico', callback_data: 'food_Pane Proteico' },
                    ],
                    [
                      { text: '🔍 Sfoglia lista completa', web_app: { url: frequentFoodsUrl } },
                    ],
                  ],
                },
              }
            );
            return NextResponse.json({ ok: true });
          }


      if (text === '🏃 Attività') {
        await sendMessage(
          chatId,
          `🏃 *Logga Attività Fisica*\n\nSeleziona un'attività preset o inserisci calorie personalizzate:`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🚶 Camminata 15\'', callback_data: 'activity_walk15' },
                  { text: '🚶 Camminata 30\'', callback_data: 'activity_walk30' },
                ],
                [
                  { text: '🚶 Camminata 1h', callback_data: 'activity_walk60' },
                  { text: '🏃 Corsa 30\'', callback_data: 'activity_run30' },
                ],
                [
                  { text: '🚴 Bici 30\'', callback_data: 'activity_bike30' },
                  { text: '💪 Palestra 1h', callback_data: 'activity_gym60' },
                ],
                [
                  { text: '✏️ Inserisci kcal', callback_data: 'activity_custom' },
                ],
              ],
            },
          }
        );
        return NextResponse.json({ ok: true });
        }

if (text === '📊 Statistiche') {
          const statsUrl = buildStatsUrl(userData, userId);
          const BMR = 1600;
          const totalTarget = BMR + userData.activeCalories;
          const bilancio = userData.calories - totalTarget;
          const bilancioStr = bilancio >= 0 ? `+${bilancio}` : `${bilancio}`;

          let statsMessage = `📊 *Statistiche di oggi*\n\n`;
          statsMessage += `🍽 *NUTRIZIONE*\n`;
          statsMessage += `🔥 Calorie totali: ${userData.calories} kcal\n`;
          statsMessage += `🥩 Proteine: ${userData.protein}g\n`;
          statsMessage += `🍞 Carboidrati: ${userData.carbs}g\n`;
          statsMessage += `🥑 Grassi: ${userData.fats}g\n`;
          statsMessage += `🌾 Fibre: ${userData.fiber}g\n\n`;
            const bilancioEmoji = bilancio > 50 ? '⚠️' : '';
              const onTrack = bilancio <= 0 ? '\ncalories on track' : '';
              statsMessage += `🔥 *BILANCIO CALORICO*\n`;
              statsMessage += `BMR ${BMR} + 🏃 ${userData.activeCalories} = ${totalTarget}\n`;
              statsMessage += `🎯 Target: ${totalTarget}\n`;
              statsMessage += `🍽️ Consumed: ${userData.calories} → ${bilancioStr} ${bilancioEmoji}${onTrack}\n\n`;
          statsMessage += `💧 *IDRATAZIONE*\n`;
          statsMessage += `💦 Acqua: ${userData.water}ml (${(userData.water / 1000).toFixed(1)}L)\n\n`;
          statsMessage += `👇 _Clicca il bottone per vedere i dettagli completi_`;

        await sendMessage(chatId, statsMessage, {
          reply_markup: {
            inline_keyboard: [[
              { text: '📊 Apri Statistiche Dettagliate', web_app: { url: statsUrl } },
            ]],
          },
        });
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        `Non ho capito "${text}".\n\nUsa i bottoni della tastiera!`,
        { reply_markup: mainKeyboard }
      );
    }

if (update.callback_query) {
        const query = update.callback_query;
        const data = query.data;
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const userId = query.from.id;
        
        // Load from Supabase
        const userData = await loadUserFromSupabase(userId);

        if (data.startsWith('food_')) {
          const foodName = data.replace('food_', '');
          const food = FOODS[foodName];

          if (!food) {
            await answerCallbackQuery(query.id, '❌ Errore!');
            return NextResponse.json({ ok: true });
          }

          userData.awaitingQuantity = foodName;
          await answerCallbackQuery(query.id);
          await editMessageText(chatId, messageId, `${food.emoji} *${foodName}*\n\nQuanti grammi vuoi loggare?\n\nUsa i bottoni rapidi o scrivi un numero personalizzato:`);
          await sendMessage(
            chatId,
            `Seleziona quantità:`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '50g', callback_data: `gram_${foodName}_50` },
                    { text: '100g', callback_data: `gram_${foodName}_100` },
                    { text: '150g', callback_data: `gram_${foodName}_150` },
                  ],
                  [
                    { text: '200g', callback_data: `gram_${foodName}_200` },
                    { text: '250g', callback_data: `gram_${foodName}_250` },
                    { text: '300g', callback_data: `gram_${foodName}_300` },
                  ],
                  [
                    { text: '✏️ Scrivi quantità', callback_data: `custom_${foodName}` },
                  ],
                ],
              },
            }
          );
          return NextResponse.json({ ok: true });
        }

if (data.startsWith('activity_')) {
          const activityType = data.replace('activity_', '');

          if (activityType === 'custom') {
            userData.awaitingActivity = true;
            await answerCallbackQuery(query.id);
            await editMessageText(chatId, messageId, `✏️ *Calorie personalizzate*\n\nScrivi quante calorie hai bruciato con l'attività:`);
            return NextResponse.json({ ok: true });
          }

          const activity = ACTIVITIES[activityType];
          if (!activity) {
            await answerCallbackQuery(query.id, '❌ Errore!');
            return NextResponse.json({ ok: true });
          }

          userData.activeCalories += activity.kcal;
          userData.activities.push({ name: activity.name, kcal: activity.kcal });
          await syncUserToSupabase(userId);

          await answerCallbackQuery(query.id, `✅ ${activity.kcal} kcal loggate!`);
          await editMessageText(
            chatId,
            messageId,
            `✅ *Attività loggata!*\n\n${activity.name}\nCalorie bruciate: ${activity.kcal} kcal\n\n📊 *Totale calorie attive oggi:* ${userData.activeCalories} kcal`
          );
          return NextResponse.json({ ok: true });
        }

        if (data.startsWith('water_')) {
          const waterValue = data.replace('water_', '');

          if (waterValue === 'custom') {
            userData.awaitingWater = true;
            await answerCallbackQuery(query.id);
            await editMessageText(chatId, messageId, `✏️ *Quantità personalizzata*\n\nScrivi quanti ml di acqua vuoi loggare:`);
            return NextResponse.json({ ok: true });
          }

          const ml = parseInt(waterValue);
          userData.water += ml;
          await syncUserToSupabase(userId);
          await answerCallbackQuery(query.id, `✅ ${ml}ml aggiunti!`);
          await editMessageText(
            chatId,
            messageId,
            `💧 *Acqua aggiunta!*\n\nQuantità: ${ml}ml\n📊 Totale oggi: ${userData.water}ml (${(userData.water / 1000).toFixed(1)}L)`
          );
          return NextResponse.json({ ok: true });
        }

      if (data.startsWith('gram_')) {
        const parts = data.split('_');
        const foodName = parts.slice(1, -1).join('_');
        const grams = parseInt(parts[parts.length - 1]);
        const food = FOODS[foodName];

        if (!food) {
          await answerCallbackQuery(query.id, '❌ Errore!');
          return NextResponse.json({ ok: true });
        }

        const { calories } = logFood(userData, foodName, grams);
        await syncUserToSupabase(userId);
        await answerCallbackQuery(query.id, `✅ ${grams}g loggati!`);
        await editMessageText(
          chatId,
          messageId,
          `✅ *Cibo loggato!*\n\n${food.emoji} ${foodName}\nQuantità: ${grams}g\nCalorie: ${calories} kcal\n\n📊 *Totale oggi:*\n🔥 ${userData.calories} kcal\n🥩 Proteine: ${userData.protein}g\n🍞 Carbs: ${userData.carbs}g\n🥑 Grassi: ${userData.fats}g\n🌾 Fibre: ${userData.fiber}g`
        );
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('custom_')) {
        const foodName = data.replace('custom_', '');
        userData.awaitingQuantity = foodName;
        await answerCallbackQuery(query.id);
        await editMessageText(
          chatId,
          messageId,
          `✏️ *Quantità personalizzata*\n\nScrivi quanti grammi vuoi loggare per:\n${FOODS[foodName].emoji} ${foodName}`
        );
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(query.id);
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
