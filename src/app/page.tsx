"use client";

import Link from "next/link";

export default function Home() {
  const demoUrl = "/stats?calories=850&protein=45&carbs=90&fats=35&fiber=12&water=1500&activeCalories=200&foods=" + 
    encodeURIComponent("Skyr Lidl:150:90:16.5:6:0.3:0|Pane Proteico:100:225:18:14:9:8|Cioccolato 78%:30:176:3:9:13.5:3.3");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-purple-50 p-8">
      <div
        className="mb-8 text-5xl font-bold"
        style={{
          background: "linear-gradient(90deg, #7DD3C0 0%, #A8B8E6 50%, #D4A5E8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Giada.
      </div>

      <p className="mb-8 max-w-md text-center text-gray-600">
        Assistente nutrizionale per Telegram Mini App.
        <br />
        Traccia calorie, macro e idratazione.
      </p>

      <div className="flex flex-col gap-4">
        <Link
          href={demoUrl}
          className="rounded-full bg-teal-400 px-8 py-3 text-center font-semibold text-white shadow-lg transition-all hover:bg-teal-500 hover:shadow-xl"
        >
          📊 Demo Statistiche
        </Link>

        <Link
          href="/stats"
          className="rounded-full border-2 border-teal-400 bg-white px-8 py-3 text-center font-semibold text-teal-500 transition-all hover:bg-teal-50"
        >
          📱 Mini App (vuota)
        </Link>
      </div>

      <div className="mt-12 rounded-xl bg-white/80 p-6 shadow-sm backdrop-blur">
        <h3 className="mb-3 font-semibold text-gray-800">Setup Bot Telegram:</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. Configura <code className="rounded bg-gray-100 px-1">TELEGRAM_BOT_TOKEN</code> in .env</li>
          <li>2. Configura <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_WEBAPP_URL</code> col tuo URL</li>
          <li>3. Imposta il webhook: <code className="rounded bg-gray-100 px-1">/api/telegram</code></li>
        </ol>
      </div>
    </div>
  );
}
