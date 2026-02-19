import { Icon } from "@iconify/react";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-1 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-colors shrink-0">
        <Icon icon={icon} width={22} />
      </div>
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
