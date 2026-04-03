"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/Button";

function ProgressoContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get("userId");

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

      {/* Page title */}
      <h1 className="page-title px-1">Tuo progresso</h1>

      {/* Placeholder */}
      <div
        className="rounded-[var(--rounded-6)] p-6 flex flex-col items-center justify-center gap-2 mt-4"
        style={{ backgroundColor: "var(--color-white)", boxShadow: "var(--shadow-sm)", minHeight: "200px" }}
      >
        <span className="card-secondary-title">In arrivo</span>
        <span className="help-text">Metriche su obiettivi, kcal e macro</span>
      </div>
    </div>
  );
}

export default function ProgressoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--neutral-bg)" }}>
        <span className="body-md" style={{ color: "var(--placeholder)" }}>Caricamento…</span>
      </div>
    }>
      <ProgressoContent />
    </Suspense>
  );
}
