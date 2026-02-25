import { Icon } from "@iconify/react";

interface StatsCardProps {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
}

export default function StatsCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-white/6 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon icon={icon} className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            }`}
          >
            {trend.value}
            <Icon
              icon={trend.positive ? "mdi:arrow-top-right" : "mdi:arrow-bottom-right"}
              className="w-3 h-3 ml-1"
            />
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-semibold text-white mt-1 tracking-tight">
        {value}
      </h3>
    </div>
  );
}
