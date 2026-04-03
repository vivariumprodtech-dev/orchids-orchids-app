"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const BOOKMARKS = [
  { label: "Alex",       id: "6217569048" },
  { label: "Camila",     id: "1722322879" },
  { label: "Ugo (demo)", id: "ugo_demo"   },
];

export default function Home() {
  const [chatId, setChatId]   = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleGo = () => {
    if (chatId.trim()) router.push(`/profile?userId=${chatId.trim()}`);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res  = await fetch("/api/sync-airtable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync error");
      setMessage({ text: "Sync complete!", type: "success" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6 gap-8"
      style={{ backgroundColor: "var(--neutral-bg)" }}
    >
      {/* Logo */}
      <div>
        <span
          className="heading-2"
          style={{
            background: "linear-gradient(90deg, var(--color-ciano-400) 0%, var(--color-blue-400) 50%, var(--color-fucsia-400) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Giada.
        </span>
      </div>

      {/* Subtitle */}
      <p className="body-md text-center max-w-xs" style={{ color: "var(--placeholder)" }}>
        Nutritional assistant for Telegram Mini App
      </p>

      {/* User lookup card */}
      <div
        className="w-full max-w-sm rounded-[var(--rounded-6)] p-6 flex flex-col gap-4"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <span className="label-md" style={{ color: "var(--subtitle-1)" }}>
          Open user profile
        </span>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            placeholder="Enter Telegram Chat ID…"
            className="flex-1 rounded-[var(--rounded-4)] px-4 py-2.5 body-md outline-none transition-all"
            style={{
              border: "var(--border-2) solid var(--border)",
              backgroundColor: "var(--neutral-bg)",
              color: "var(--body)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary-action)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            onClick={handleGo}
            disabled={!chatId.trim()}
            className="rounded-[var(--rounded-4)] px-5 py-2.5 label-md transition-all active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary-action)",
              color: "var(--invert)",
            }}
          >
            Go
          </button>
        </div>

        {/* Bookmarks */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm" style={{ color: "var(--placeholder)" }}>Quick:</span>
          {BOOKMARKS.map((b) => (
            <button
              key={b.id}
              onClick={() => setChatId(b.id)}
              className="rounded-[var(--rounded-full)] px-3 py-1 label-sm transition-colors"
              style={{
                backgroundColor: "var(--primary-bg)",
                color: "var(--primary-action)",
                border: "var(--border-1) solid var(--color-ciano-200)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sync button */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 rounded-[var(--rounded-full)] py-3.5 label-md transition-all active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary-action)",
            color: "var(--invert)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {syncing
            ? <><Loader2 size={18} className="animate-spin" /> Syncing…</>
            : <><RefreshCw size={18} /> Sync Airtable data</>}
        </button>

        {message && (
          <div
            className="flex items-center gap-2 rounded-[var(--rounded-4)] px-4 py-2.5 body-sm"
            style={{
              backgroundColor: message.type === "success" ? "var(--success-bg)"  : "var(--danger-bg)",
              color:           message.type === "success" ? "var(--success-text)" : "var(--danger-text)",
            }}
          >
            {message.type === "success"
              ? <CheckCircle2 size={16} />
              : <AlertCircle  size={16} />}
            {message.text}
          </div>
        )}
      </div>

      {/* Setup hint */}
      <div
        className="w-full max-w-sm rounded-[var(--rounded-5)] p-5"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-xs)",
          border: "var(--border-1) solid var(--border)",
        }}
      >
        <p className="label-sm mb-3" style={{ color: "var(--subtitle-2)" }}>Telegram Bot Setup</p>
        <ol className="flex flex-col gap-1.5">
          {[
            <>Set <code className="rounded px-1 body-sm" style={{ backgroundColor: "var(--neutral-bg)", color: "var(--subtitle-1)" }}>TELEGRAM_BOT_TOKEN</code> in .env</>,
            <>Set <code className="rounded px-1 body-sm" style={{ backgroundColor: "var(--neutral-bg)", color: "var(--subtitle-1)" }}>NEXT_PUBLIC_WEBAPP_URL</code> to your URL</>,
            <>Register webhook at <code className="rounded px-1 body-sm" style={{ backgroundColor: "var(--neutral-bg)", color: "var(--subtitle-1)" }}>/api/telegram</code></>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 help-text">
              <span
                className="label-sm shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-px"
                style={{ backgroundColor: "var(--primary-bg)", color: "var(--primary-action)" }}
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
