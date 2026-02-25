export const ASSET_TYPES = ["property", "crypto", "car"] as const;

export const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  property: { label: "Property", icon: "mdi:home-city", color: "text-blue-400 bg-blue-500/10" },
  crypto: { label: "Crypto", icon: "mdi:bitcoin", color: "text-orange-400 bg-orange-500/10" },
  car: { label: "Car", icon: "mdi:car", color: "text-emerald-400 bg-emerald-500/10" },
};

export const LOAN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  repaid: { label: "Repaid", color: "bg-zinc-800 text-zinc-500 border-zinc-700" },
};

export const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: "mdi:view-dashboard" },
  { label: "Users", href: "/users", icon: "mdi:account-group" },
  { label: "Assets", href: "/assets", icon: "mdi:wallet" },
  { label: "Loans", href: "/loans", icon: "mdi:cash-multiple" },
] as const;
