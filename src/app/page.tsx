"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/Button";

const BOOKMARKS = [
  { label: "Alex",       id: "6217569048" },
  { label: "Camila",     id: "1722322879" },
  { label: "Ugo (demo)", id: "ugo_demo"   },
];

export default function Home() {
  const [chatId, setChatId] = useState("");
  const [registering, setRegistering] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{ ok: boolean; webhookUrl?: string; error?: string } | null>(null);
  const router = useRouter();

  const handleGo = () => {
    if (chatId.trim()) router.push(`/profile?userId=${chatId.trim()}`);
  };

  const handleRegisterWebhook = async () => {
    setRegistering(true);
    setWebhookStatus(null);
    try {
      const res = await fetch("/api/setup-webhook", { method: "POST" });
      const data = await res.json();
      setWebhookStatus(data);
    } catch {
      setWebhookStatus({ ok: false, error: "Network error" });
    } finally {
      setRegistering(false);
    }
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

      {/* Webhook registration card */}
      <div
        className="w-full max-w-sm rounded-[var(--rounded-5)] p-5 flex flex-col gap-4"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-xs)",
          border: "var(--border-1) solid var(--border)",
        }}
      >
        <div>
          <p className="label-sm mb-1" style={{ color: "var(--subtitle-2)" }}>Telegram Webhook</p>
          <p className="body-sm" style={{ color: "var(--placeholder)" }}>
            The webhook is auto-registered on every deploy. Use this only if you need to manually force a re-registration.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleRegisterWebhook}
          disabled={registering}
          iconStart={registering ? Loader2 : RefreshCw}
        >
          {registering ? "Registering…" : "Register Webhook"}
        </Button>

        {webhookStatus && (
          <div
            className="flex flex-col gap-1 rounded-[var(--rounded-4)] px-4 py-3 body-sm"
            style={{
              backgroundColor: webhookStatus.ok ? "var(--success-bg)" : "var(--danger-bg)",
              color:           webhookStatus.ok ? "var(--success-text)" : "var(--danger-text)",
            }}
          >
            <div className="flex items-center gap-2">
              {webhookStatus.ok
                ? <CheckCircle2 size={15} />
                : <AlertCircle size={15} />}
              <span className="label-sm">
                {webhookStatus.ok ? "Webhook registered!" : "Registration failed"}
              </span>
            </div>
            {webhookStatus.webhookUrl && (
              <span style={{ wordBreak: "break-all", opacity: 0.8 }}>
                {webhookStatus.webhookUrl}
              </span>
            )}
            {webhookStatus.error && (
              <span>{webhookStatus.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
