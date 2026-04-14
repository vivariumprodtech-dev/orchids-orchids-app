"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

const BOOKMARKS = [
  { label: "Alex",       id: "6217569048" },
  { label: "Camila",     id: "1722322879" },
  { label: "Ugo (demo)", id: "ugo_demo"   },
];

export default function Home() {
  const [chatId, setChatId] = useState("");
  const router = useRouter();

  const handleGo = () => {
    if (chatId.trim()) router.push(`/profile?userId=${chatId.trim()}`);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6 gap-8"
      style={{ backgroundColor: "var(--neutral-bg)" }}
    >
      {/* Logo */}
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

      {/* Subtitle */}
      <p className="body-md text-center max-w-xs" style={{ color: "var(--placeholder)" }}>
        Nutritional assistant for Telegram Mini App
      </p>

      {/* User lookup card */}
      <div
        className="w-full max-w-sm rounded-[var(--rounded-6)] p-6 flex flex-col gap-4"
        style={{ backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-md)" }}
      >
        <span className="label-md" style={{ color: "var(--subtitle-1)" }}>
          Open user profile
        </span>

        {/* Input + Go */}
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
          <Button
            variant="primary"
            size="sm"
            onClick={handleGo}
            disabled={!chatId.trim()}
            style={{ borderRadius: "var(--rounded-4)" }}
          >
            Go
          </Button>
        </div>

        {/* Bookmarks */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm" style={{ color: "var(--placeholder)" }}>Quick:</span>
          {BOOKMARKS.map((b) => (
            <Button
              key={b.id}
              variant="primary-tonal"
              size="sm"
              onClick={() => setChatId(b.id)}
            >
              {b.label}
            </Button>
          ))}
        </div>
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
