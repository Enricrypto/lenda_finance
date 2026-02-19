"use client";

import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Account settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xl">
            {session?.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) ?? "??"}
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-900">
              {session?.user?.name ?? "Loading..."}
            </h2>
            <p className="text-sm text-slate-500">
              {session?.user?.email ?? ""}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <Icon icon="mdi:identifier" className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">User ID</p>
              <p className="text-sm font-mono text-slate-700">
                {session?.user?.id ?? "..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
