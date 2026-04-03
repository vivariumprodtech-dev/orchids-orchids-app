"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Flag, Settings2 } from "lucide-react";

interface ProfileData {
  name: string;
  initials: string;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get("userId");

  const [profile, setProfile] = useState<ProfileData>({ name: "User", initials: "US" });

  useEffect(() => {
    if      (userId === "6217569048") setProfile({ name: "Alex",   initials: "AL" });
    else if (userId === "1722322879") setProfile({ name: "Camila", initials: "CA" });
    else if (userId === "ugo_demo")   setProfile({ name: "Ugo",    initials: "UG" });
    else if (userId)                  setProfile({ name: "User",   initials: userId.slice(0, 2).toUpperCase() });
  }, [userId]);

  const menuItems = [
    { label: "Set your goals",  icon: Flag,      onClick: () => {} },
    { label: "Giada settings",  icon: Settings2, onClick: () => {} },
  ];

  return (
    <div
      className="min-h-screen flex flex-col p-5 gap-3"
      style={{ backgroundColor: "var(--neutral-bg)" }}
    >
      {/* Back button */}
      <div className="flex items-center -ml-1 mb-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded-[var(--rounded-full)] py-1.5 pr-3 pl-1.5 transition-all active:scale-95"
          style={{ color: "var(--primary-action)" }}
        >
          <ChevronLeft size={20} />
          <span className="label-sm">Back</span>
        </button>
      </div>

      {/* Profile card */}
      <div
        className="rounded-[var(--rounded-6)] p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center label-lg shrink-0"
            style={{
              backgroundColor: "var(--primary-surface)",
              color: "var(--invert)",
            }}
          >
            {profile.initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="card-main-title">{profile.name}</span>
            <span className="help-text">Profile</span>
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
            style={{
              backgroundColor: "var(--color-white)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[var(--rounded-3)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--primary-bg)" }}
              >
                <Icon size={18} style={{ color: "var(--primary-action)" }} />
              </div>
              <span className="card-secondary-title">{item.label}</span>
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
        <span className="body-md" style={{ color: "var(--placeholder)" }}>Loading…</span>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
