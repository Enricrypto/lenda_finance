import { Icon } from "@iconify/react";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";

export default function AssetTypeIcon({ type }: { type: string }) {
  const config = ASSET_TYPE_CONFIG[type] || {
    label: type,
    icon: "mdi:help-circle",
    color: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${config.color}`}>
        <Icon icon={config.icon} className="w-4 h-4" />
      </div>
      <span className="capitalize">{config.label}</span>
    </div>
  );
}
