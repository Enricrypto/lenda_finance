import { Icon } from "@iconify/react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({
  icon = "mdi:inbox-outline",
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon icon={icon} className="w-12 h-12 text-zinc-700 mb-4" />
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-600 mt-1">{description}</p>
      )}
    </div>
  );
}
