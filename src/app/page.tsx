"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Home() {
  const [chatId, setChatId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleViewStats = () => {
    if (chatId) {
      router.push(`/stats?userId=${chatId}`);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync-airtable", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Errore durante la sincronizzazione");

      setMessage({ text: "Sincronizzazione completata!", type: "success" });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Errore: ${err.message}`, type: "error" });
    } finally {
      setSyncing(false);
    }
  };

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

      <div className="mb-10 w-full max-w-sm rounded-2xl bg-white/60 p-6 shadow-xl backdrop-blur-md border border-white/20">
        <div className="flex flex-col gap-4">
          <label htmlFor="chatId" className="text-sm font-bold text-gray-700 flex items-center gap-2">
            🔍 Visualizza Statistiche Utente
          </label>
          <div className="flex gap-2">
            <input
              id="chatId"
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Inserisci ChatID..."
              className="flex-1 rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-400/10 transition-all"
            />
            <button
              onClick={handleViewStats}
              className="rounded-xl bg-teal-400 px-6 py-2.5 font-bold text-white shadow-lg shadow-teal-400/20 transition-all hover:bg-teal-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              disabled={!chatId}
            >
              Vai
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bookmarks:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setChatId("6217569048")}
                className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600 border border-teal-100 hover:bg-teal-100 transition-colors"
              >
                👤 Alex
              </button>
              <button
                onClick={() => setChatId("1722322879")}
                className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                👤 Camila
              </button>
              <button
                onClick={() => setChatId("ugo_demo")}
                className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                👤 Ugo (demo)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href={demoUrl}
          className="rounded-full bg-teal-400 px-8 py-3 text-center font-semibold text-white shadow-lg transition-all hover:bg-teal-500 hover:shadow-xl"
        >
          📊 Demo Statistiche
        </Link>

        <Link
          href="/upload"
          className="rounded-full border-2 border-teal-400 bg-white px-8 py-3 text-center font-semibold text-teal-500 transition-all hover:bg-teal-50"
        >
          📤 Upload Dati CSV
        </Link>

        <Link
          href="/stats"
          className="rounded-full border-2 border-gray-200 bg-white px-8 py-3 text-center font-semibold text-gray-500 transition-all hover:bg-gray-50"
        >
          📱 Mini App (vuota)
        </Link>
      </div>

      <div className="mt-12 rounded-xl bg-white/80 p-6 shadow-sm backdrop-blur">
        <h3 className="mb-3 font-semibold" style={{ color: '#262C44' }}>Setup Bot Telegram:</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. Configura <code className="rounded bg-gray-100 px-1">TELEGRAM_BOT_TOKEN</code> in .env</li>
          <li>2. Configura <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_WEBAPP_URL</code> col tuo URL</li>
          <li>3. Imposta il webhook: <code className="rounded bg-gray-100 px-1">/api/telegram</code></li>
        </ol>
      </div>
    </div>
  );
}
