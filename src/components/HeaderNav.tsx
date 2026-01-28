"use client";

import { BarChart3, User2 } from "lucide-react";

interface HeaderNavProps {
  activeView: "day" | "progress" | "profile";
  onViewChange: (view: "day" | "progress" | "profile") => void;
}

export default function HeaderNav({ activeView, onViewChange }: HeaderNavProps) {
  const buttonBase = "flex h-6 items-center justify-center rounded-full transition-colors";
  const labelStyle = "text-caption-custom";

  const getButtonStyles = (view: "day" | "progress" | "profile") => {
    const isActive = activeView === view;
    return isActive
      ? "bg-[var(--text-secondary)] text-[var(--text-invert)]"
      : "bg-[var(--text-invert)] text-[var(--text-secondary)]";
  };

  const getLabelStyles = (view: "day" | "progress" | "profile") => {
    const isActive = activeView === view;
    return isActive ? "text-[var(--text-invert)]" : "text-[var(--text-secondary)]";
  };

  const getIconColor = (view: "day" | "progress" | "profile") => {
    return activeView === view ? "var(--text-invert)" : "var(--text-secondary)";
  };

  return (
    <nav className="flex items-center gap-2">
      <button
        onClick={() => onViewChange("day")}
        className={`${buttonBase} px-2 py-1 gap-[10px] ${getButtonStyles("day")}`}
      >
        <span className={`${labelStyle} ${getLabelStyles("day")}`}>Day view</span>
      </button>

      <button
        onClick={() => onViewChange("progress")}
        className={`${buttonBase} px-2 py-1 gap-[10px] ${getButtonStyles("progress")}`}
      >
        <BarChart3 size={16} color={getIconColor("progress")} />
        <span className={`${labelStyle} ${getLabelStyles("progress")}`}>Progress</span>
      </button>

      <button
        onClick={() => onViewChange("profile")}
        className={`flex w-6 h-6 p-1 justify-center items-center rounded-full transition-colors ${getButtonStyles("profile")}`}
      >
        <User2 size={16} color={getIconColor("profile")} />
      </button>
    </nav>
  );
}
