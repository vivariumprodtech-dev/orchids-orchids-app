"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Flag, Settings2, TrendingUp } from "lucide-react";
import { Button } from "@/components/Button";

interface ProfileData {
  name: string;
  initials: string;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get("userId");

  const [profile, setProfile] = useState<ProfileData>({ name: "Utente", initials: "UT" });

  useEffect(() => {
    if      (userId === "6217569048") setProfile({ name: "Alex",   initials: "AL" });
    else if (userId === "1722322879") setProfile({ name: "Camila", initials: "CA" });
    else if (userId === "ugo_demo")   setProfile({ name: "Ugo",    initials: "UG" });
    else if (userId)                  setProfile({ name: "Utente", initials: userId.slice(0, 2).toUpperCase() });
  }, [userId]);

  const menuItems = [
    {
      label:    "Tuo progresso",
      sublabel: "Obiettivi, kcal e macro",
      icon:     TrendingUp,
      onClick:  () => router.push(`/progresso?userId=${userId}`),
    },
    {
      label:    "I tuoi obiettivi",
      sublabel: "Modifica i tuoi target",
      icon:     Flag,
      onClick:  () => {},
    },
    {
      label:    "Impostazioni Giada",
      sublabel: "Preferenze e configurazione",
      icon:     Settings2,
      onClick:  () => {},
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col p-5 gap-3"
      style={{ backgroundColor: "var(--neutral-bg)" }}
    >
      {/* Back */}
      <div className="flex items-center -ml-1 mb-1">
        <Button
          variant="neutral-link"
          size="sm"
          iconStart={ChevronLeft}
          onClick={() => router.back()}
        >
          Indietro
        </Button>
      </div>

      {/* Profile card */}
      <div
        className="rounded-[var(--rounded-6)] p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
        style={{ backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center label-lg shrink-0"
            style={{ backgroundColor: "var(--primary-surface)", color: "var(--invert)" }}
          >
            {profile.initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="card-main-title">{profile.name}</span>
            <span className="help-text">Profilo</span>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: "var(--placeholder)" }} />
      </div>

      {/* Menu items */}
      {menuItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            onClick={item.onClick}
            className="rounded-[var(--rounded-6)] p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-sm)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--neutral-tonal-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-white)")}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[var(--rounded-3)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--primary-bg)" }}
              >
                <Icon size={18} style={{ color: "var(--primary-action)" }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="card-secondary-title">{item.label}</span>
                <span className="help-text">{item.sublabel}</span>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: "var(--placeholder)" }} />
          </div>
        );
      })}

      {/* Footer */}
      <div className="mt-auto pt-10 pb-2 flex justify-center">
        <span
          className="heading-4"
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
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--neutral-bg)" }}>
        <span className="body-md" style={{ color: "var(--placeholder)" }}>Caricamento…</span>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
