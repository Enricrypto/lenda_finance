"use client";

import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Account settings and preferences</p>
      </div>

      <div className="bg-surface rounded-xl border border-white/6 p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-semibold text-xl">
            {session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">{session?.user?.name ?? "Loading..."}</h2>
            <p className="text-sm text-zinc-500">{session?.user?.email ?? ""}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/4 border border-white/6">
            <Icon icon="mdi:identifier" className="w-5 h-5 text-zinc-600" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">User ID</p>
              <p className="text-sm font-mono text-zinc-300 mt-0.5">{session?.user?.id ?? "..."}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
