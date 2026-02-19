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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon icon={icon} className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
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
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-2xl font-semibold text-slate-900 mt-1 tracking-tight">
        {value}
      </h3>
    </div>
  );
}
