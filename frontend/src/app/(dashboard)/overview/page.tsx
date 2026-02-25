"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAggregateStats } from "@/hooks/useAggregateStats";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#141414",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  color: "#e4e4e7",
};

export default function OverviewPage() {
  const { isLoading, totalDeposited, totalBorrowed, netYield, userCount, users, assets, loans } = useAggregateStats();

  if (isLoading) return <LoadingSpinner />;

  const chartData = (users ?? []).map((user) => {
    const userAssets = assets?.filter((a) => a.user_id === user.id) ?? [];
    const userLoans = loans?.filter((l) => l.user_id === user.id) ?? [];
    const deposited = userAssets.reduce((s, a) => s + a.value, 0);
    const borrowed = userLoans.reduce((s, l) => {
      if (l.status === "repaid") return s;
      return s + Math.max(l.amount - l.amount_repaid, 0);
    }, 0);
    return { name: user.name.split(" ")[0], Deposits: deposited, Loans: borrowed };
  });

  const maxBorrow = totalDeposited * 0.5;
  const utilization = maxBorrow > 0 ? (totalBorrowed / maxBorrow) * 100 : 0;
  const riskLevel = utilization > 80 ? "High" : utilization > 50 ? "Medium" : "Low";
  const riskColor = utilization > 80 ? "text-red-400" : utilization > 50 ? "text-amber-400" : "text-emerald-400";

  const assetsByType = Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => ({
    type, label: config.label,
    total: assets?.filter((a) => a.type === type).reduce((s, a) => s + a.value, 0) ?? 0,
  }));

  const topUsers = [...(users ?? [])]
    .map((user) => {
      const userAssets = assets?.filter((a) => a.user_id === user.id) ?? [];
      const userLoans = loans?.filter((l) => l.user_id === user.id) ?? [];
      const deposited = userAssets.reduce((s, a) => s + a.value, 0);
      const borrowed = userLoans.reduce((s, l) => {
        if (l.status === "repaid") return s;
        return s + Math.max(l.amount - l.amount_repaid, 0);
      }, 0);
      return { ...user, deposited, borrowed };
    })
    .sort((a, b) => b.deposited - a.deposited)
    .slice(0, 5);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Financial Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Global performance metrics for assets and loans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Assets Deposited" value={formatCurrency(totalDeposited)} icon="mdi:wallet" iconBg="bg-cyan-500/10" iconColor="text-cyan-400" />
        <StatsCard label="Total Borrowed" value={formatCurrency(totalBorrowed)} icon="mdi:arrow-down-circle" iconBg="bg-orange-500/10" iconColor="text-orange-400" />
        <StatsCard label="Platform Net Yield" value={formatCurrency(netYield)} icon="mdi:percent" iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        <StatsCard label="Total Users" value={String(userCount)} icon="mdi:account-group" iconBg="bg-blue-500/10" iconColor="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-white/6 p-6">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-6">Assets vs Loans by User</h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#52525b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#52525b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Deposits" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Loans" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-400" /><span className="text-xs text-zinc-500">Deposits</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-zinc-600" /><span className="text-xs text-zinc-500">Borrowed</span></div>
          </div>
        </div>

        {/* Risk Factor Card */}
        <div className="bg-surface rounded-xl border border-white/6 p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Risk Factor</p>
            <h3 className={`text-4xl font-semibold tracking-tight mt-2 ${riskColor}`}>{riskLevel}</h3>
          </div>
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-zinc-500">Collateral Utilization</span>
              <span className="text-sm font-semibold text-white">{utilization.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/6 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <div className="mt-6 space-y-3">
              {assetsByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Icon icon={ASSET_TYPE_CONFIG[item.type].icon} className="w-4 h-4" />
                    {item.label}
                  </span>
                  <span className="text-zinc-300">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
        <div className="p-6 border-b border-white/6 flex justify-between items-center">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Top Users</h3>
          <Link href="/users" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all →</Link>
        </div>
        {topUsers.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-600">No users yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Assets</th>
                  <th className="px-6 py-4 font-medium">Loans</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4 text-sm">
                {topUsers.map((user) => {
                  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <tr key={user.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-medium text-xs">{initials}</div>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{formatCurrency(user.deposited)}</td>
                      <td className="px-6 py-4 text-zinc-500">{formatCurrency(user.borrowed)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/users/${user.id}`} className="text-zinc-600 hover:text-cyan-400 transition-colors">
                          <Icon icon="mdi:chevron-right" className="w-5 h-5 inline" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
