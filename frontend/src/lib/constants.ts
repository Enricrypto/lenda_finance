export const ASSET_TYPES = ["property", "crypto", "car"] as const;

export const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  property: { label: "Property", icon: "mdi:home-city", color: "text-blue-600 bg-blue-50" },
  crypto: { label: "Crypto", icon: "mdi:bitcoin", color: "text-orange-600 bg-orange-50" },
  car: { label: "Car", icon: "mdi:car", color: "text-emerald-600 bg-emerald-50" },
};

export const LOAN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  approved: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  repaid: { label: "Repaid", color: "bg-slate-50 text-slate-600 border-slate-200" },
};

export const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: "mdi:view-dashboard" },
  { label: "Users", href: "/users", icon: "mdi:account-group" },
  { label: "Assets", href: "/assets", icon: "mdi:wallet" },
  { label: "Loans", href: "/loans", icon: "mdi:cash-multiple" },
] as const;
