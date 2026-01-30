"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronRight, BarChart3, Utensils, Flag, Settings2, ChevronLeft } from "lucide-react";

interface ProfileData {
  name: string;
  initials: string;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  
  const [profile, setProfile] = useState<ProfileData>({
    name: "User",
    initials: "US",
  });

  useEffect(() => {
    if (userId === "6217569048") {
      setProfile({ name: "Alex", initials: "AL" });
    } else if (userId === "1722322879") {
      setProfile({ name: "Camila", initials: "CA" });
    } else if (userId === "ugo_demo") {
      setProfile({ name: "Ugo", initials: "UG" });
    } else if (userId) {
      setProfile({ name: "Sarah Minuzzi", initials: "SM" });
    }
  }, [userId]);

  const menuItems = [
    {
      title: "Day view & Progress",
      icon: <BarChart3 size={20} className="text-[#5A658D]" />,
      onClick: () => router.push(`/stats?userId=${userId}`),
    },
    {
      title: "Frequent foods",
      icon: <Utensils size={20} className="text-[#5A658D]" />,
      onClick: () => {},
    },
    {
      title: "Set your goals",
      icon: <Flag size={20} className="text-[#5A658D]" />,
      onClick: () => {},
    },
    {
      title: "Giada settings",
      icon: <Settings2 size={20} className="text-[#5A658D]" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 p-5 flex flex-col">
      <div className="mb-2 flex items-center">
         <button onClick={() => router.back()} className="p-2 -ml-2 text-[#5A658D] active:scale-95 transition-transform">
            <ChevronLeft size={24} />
         </button>
      </div>

      <div className="space-y-3 flex-1">
        {/* Profile Card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between cursor-pointer active:bg-[#5A658D]/10 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#2BB0BB" }}
            >
              {profile.initials}
            </div>
            <div>
              <div className="text-title-custom text-[#262C44]">{profile.name}</div>
              <div className="text-helper-custom text-[#5A658D]">Profile</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-[#5A658D]" />
        </div>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={item.onClick}
            className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between cursor-pointer active:bg-[#5A658D]/10 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-subtitle-1-custom text-[#262C44]">{item.title}</span>
            </div>
            <ChevronRight size={20} className="text-[#5A658D]" />
          </div>
        ))}
      </div>

      {/* Footer Logo */}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
