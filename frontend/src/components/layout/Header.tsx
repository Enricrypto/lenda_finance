"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

const ROUTE_LABELS: Record<string, string> = {
  "/overview": "Dashboard",
  "/users": "Users",
  "/assets": "Assets",
  "/loans": "Loans",
  "/settings": "Settings",
};

function getBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";

  const base = `/${segments[0]}`;
  const label = ROUTE_LABELS[base] || segments[0];

  if (segments.length > 1) {
    return `${label} / Detail`;
  }
  return label;
}

export default function Header() {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="h-16 bg-background border-b border-white/6 flex items-center justify-between px-6 md:px-8 z-20 shrink-0">
      <div className="flex items-center text-sm text-zinc-600">
        <Icon icon="mdi:home" className="w-4 h-4 mr-2" />
        <span>Home</span>
        <Icon icon="mdi:chevron-right" className="w-4 h-4 mx-2" />
        <span className="font-medium text-white">{breadcrumb}</span>
      </div>
    </header>
  );
}
