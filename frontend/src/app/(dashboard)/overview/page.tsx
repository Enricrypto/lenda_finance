"use client";

import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import { useMyPosition } from "@/hooks/usePositions";
import { useAssets } from "@/hooks/useAssets";
import { useLoans } from "@/hooks/useLoans";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import LoanStatusBadge from "@/components/shared/LoanStatusBadge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG, ASSET_TYPES } from "@/lib/constants";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PIE_COLORS = ["#22d3ee", "#f59e0b", "#10b981"];
const TOOLTIP_STYLE = { backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "#e4e4e7" };

export default function OverviewPage() {
  const { data: session } = useSession();
  const { data: position, isLoading: posLoading } = useMyPosition();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: loans } = useLoans();

  if (posLoading || assetsLoading) return <LoadingSpinner />;

  const hf = position?.health_factor;
  const hfDisplay = hf === null || hf === undefined || hf > 99 ? "∞" : hf.toFixed(2);
  const hfColor = (hf === null || hf === undefined || hf > 99) ? "text-emerald-400" : hf >= 1.2 ? "text-emerald-400" : hf >= 1.0 ? "text-amber-400" : "text-red-400";
  const ltv = position?.ltv;
  const ltvPct = ltv !== null && ltv !== undefined ? Math.min(ltv * 100, 100) : 0;
  const ltvColor = ltvPct > 80 ? "bg-red-500" : ltvPct > 60 ? "bg-amber-500" : "bg-emerald-500";

  const pieData = ASSET_TYPES.map((type) => ({
    name: ASSET_TYPE_CONFIG[type].label,
    value: assets?.filter((a) => a.type === type).reduce((s, a) => s + a.stated_value, 0) ?? 0,
  })).filter((d) => d.value > 0);

  const activeLoans = loans?.filter((l) => l.status === "active").slice(0, 3) ?? [];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-zinc-500 mt-1">Your personal financial position</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Deposited"     value={formatCurrency(position?.total_deposited ?? 0)}            icon="mdi:wallet"            iconBg="bg-cyan-500/10"    iconColor="text-cyan-400" />
        <StatsCard label="Eligible Collateral" value={formatCurrency(position?.total_eligible_collateral ?? 0)}  icon="mdi:shield-check"      iconBg="bg-blue-500/10"    iconColor="text-blue-400" />
        <StatsCard label="Outstanding Debt"    value={formatCurrency((position?.total_borrowed ?? 0) + (position?.total_interest ?? 0))} icon="mdi:arrow-down-circle" iconBg="bg-orange-500/10" iconColor="text-orange-400" />
        <StatsCard label="Available Credit"    value={formatCurrency(position?.available_credit ?? 0)}           icon="mdi:credit-card"       iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-white/6 p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Health Factor</p>
            <h3 className={`text-5xl font-semibold tracking-tight mt-2 ${hfColor}`}>{hfDisplay}</h3>
            <p className="text-xs text-zinc-600 mt-2">
              {(hf === null || hf === undefined || hf > 99) ? "No active debt — fully healthy" : hf >= 1.2 ? "Position is healthy" : hf >= 1.0 ? "Warning: approaching liquidation threshold" : "Under-collateralised"}
            </p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-zinc-500">LTV Ratio</span>
              <span className="text-sm font-semibold text-white">{ltvPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/6 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${ltvColor}`} style={{ width: `${ltvPct}%` }} />
            </div>
            <div className="mt-4 space-y-2 text-xs text-zinc-600">
              <div className="flex justify-between"><span>Collateral</span><span className="text-zinc-400">{formatCurrency(position?.total_eligible_collateral ?? 0)}</span></div>
              <div className="flex justify-between"><span>Debt + Interest</span><span className="text-zinc-400">{formatCurrency((position?.total_borrowed ?? 0) + (position?.total_interest ?? 0))}</span></div>
              <div className="flex justify-between"><span>Net Yield</span><span className="text-emerald-400">{formatCurrency(position?.yield_earned ?? 0)}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface rounded-xl border border-white/6 p-6">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Asset Distribution</h3>
          {pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-zinc-600 text-sm">No assets yet</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "#71717a" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ASSET_TYPES.map((type) => {
              const count = assets?.filter((a) => a.type === type).length ?? 0;
              const val = assets?.filter((a) => a.type === type).reduce((s, a) => s + a.stated_value, 0) ?? 0;
              return (
                <div key={type} className="bg-white/4 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon={ASSET_TYPE_CONFIG[type].icon} className={`w-4 h-4 ${ASSET_TYPE_CONFIG[type].color.split(" ")[0]}`} />
                    <span className="text-xs text-zinc-500">{ASSET_TYPE_CONFIG[type].label}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatCurrency(val)}</p>
                  <p className="text-xs text-zinc-600">{count} asset{count !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeLoans.length > 0 && (
        <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
          <div className="p-6 border-b border-white/6">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Loans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Repaid</th>
                  <th className="px-6 py-4 font-medium">Interest</th>
                  <th className="px-6 py-4 font-medium">LTV</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4 text-sm">
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 text-zinc-300">{formatCurrency(loan.amount)}</td>
                    <td className="px-6 py-4 text-emerald-400">{formatCurrency(loan.amount_repaid)}</td>
                    <td className="px-6 py-4 text-amber-400">{formatCurrency(loan.accrued_interest)}</td>
                    <td className="px-6 py-4 text-zinc-500">{loan.ltv_at_origination !== null ? formatPercent(loan.ltv_at_origination) : "—"}</td>
                    <td className="px-6 py-4"><LoanStatusBadge status={loan.status} /></td>
                    <td className="px-6 py-4 text-zinc-500">{formatDate(loan.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
