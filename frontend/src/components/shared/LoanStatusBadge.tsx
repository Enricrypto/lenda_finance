import { LOAN_STATUS_CONFIG } from "@/lib/constants";

export default function LoanStatusBadge({ status }: { status: string }) {
  const config = LOAN_STATUS_CONFIG[status] || {
    label: status,
    color: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
