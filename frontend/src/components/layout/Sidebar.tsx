"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Icon } from "@iconify/react";
import { NAV_ITEMS } from "@/lib/constants";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
          <Icon icon="mdi:finance" className="text-white w-5 h-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-slate-800">
          Lenda
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Platform
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                icon={item.icon}
                className={`w-5 h-5 ${
                  isActive ? "" : "text-slate-400"
                }`}
              />
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Management
          </p>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === "/settings"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon
              icon="mdi:cog"
              className={`w-5 h-5 ${
                pathname === "/settings" ? "" : "text-slate-400"
              }`}
            />
            <span className="text-base font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {session?.user?.name || "Loading..."}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {session?.user?.email || ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Sign out"
          >
            <Icon icon="mdi:logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
