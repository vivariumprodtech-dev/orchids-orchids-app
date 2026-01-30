"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";

function FrequentFoodsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 p-5 flex flex-col">
      <div className="mb-6 flex items-center">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#5A658D] active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-[#262C44] ml-2">Frequent Foods</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl shadow-sm">
        <div className="text-4xl mb-4">🍽️</div>
        <p className="text-[#5A658D] text-lg">
          Your full list of frequent foods will appear here {userId ? `for user ${userId}` : ""}.
        </p>
      </div>

      <div className="mt-auto pt-10 pb-4 flex justify-center">
        <div className="text-3xl font-bold"
          style={{
            background: "linear-gradient(90deg, #7DD3C0 0%, #A8B8E6 50%, #D4A5E8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Giada.
        </div>
      </div>
    </div>
  );
}

export default function FrequentFoodsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <FrequentFoodsContent />
    </Suspense>
  );
}
