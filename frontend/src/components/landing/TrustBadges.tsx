import { Icon } from "@iconify/react";

const BADGES = [
  { icon: "solar:server-linear", label: "Built with FastAPI + PostgreSQL" },
  { icon: "solar:cloud-linear", label: "Deployed on AWS" },
  { icon: "solar:shield-check-linear", label: "Secure validation rules" },
] as const;

export default function TrustBadges() {
  return (
    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-6 text-xs font-[family-name:var(--font-mono)] text-slate-500">
      {BADGES.map((badge) => (
        <div key={badge.label} className="flex items-center gap-2">
          <Icon icon={badge.icon} className="text-slate-400" />
          {badge.label}
        </div>
      ))}
    </div>
  );
}
