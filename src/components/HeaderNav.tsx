"use client";

import { ChartBar, User } from "lucide-react";

interface HeaderNavProps {
  activeView: "day" | "progress" | "profile";
  onViewChange: (view: "day" | "progress" | "profile") => void;
}

export default function HeaderNav({ activeView, onViewChange }: HeaderNavProps) {
  const buttonBase = "flex h-6 items-center justify-center rounded-full transition-colors";
  const labelStyle = "text-caption-custom font-semibold";

  const getButtonStyles = (view: "day" | "progress" | "profile") => {
    const isActive = activeView === view;
    return isActive
      ? "bg-[var(--text-secondary)] text-[var(--text-invert)]"
      : "bg-[var(--text-invert)] text-[var(--text-secondary)]";
  };

  return (
    <nav className="flex items-center gap-2">
      <button
        onClick={() => onViewChange("day")}
        className={`${buttonBase} px-2 py-1 gap-[10px] ${getButtonStyles("day")}`}
      >
        <span className={labelStyle}>Day view</span>
      </button>

      <button
        onClick={() => onViewChange("progress")}
        className={`${buttonBase} px-2 py-1 gap-[10px] ${getButtonStyles("progress")}`}
      >
        <ChartBar size={16} />
        <span className={labelStyle}>Progress</span>
      </button>

      <button
        onClick={() => onViewChange("profile")}
        className={`${buttonBase} w-6 p-1 ${getButtonStyles("profile")}`}
      >
        <User size={16} />
      </button>
    </nav>
  );
}
