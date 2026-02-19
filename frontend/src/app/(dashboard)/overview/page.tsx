"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAggregateStats } from "@/hooks/useAggregateStats";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function OverviewPage() {
  const {
    isLoading,
    totalDeposited,
    totalBorrowed,
    netYield,
    userCount,
    users,
    assets,
    loans,
  } = useAggregateStats();

  if (isLoading) return <LoadingSpinner />;

  // Build per-user chart data
  const chartData = (users ?? []).map((user) => {
    const userAssets = assets?.filter((a) => a.user_id === user.id) ?? [];
    const userLoans = loans?.filter((l) => l.user_id === user.id) ?? [];
    const deposited = userAssets.reduce((s, a) => s + a.value, 0);
    const borrowed = userLoans.reduce((s, l) => {
      if (l.status === "repaid") return s;
      return s + Math.max(l.amount - l.amount_repaid, 0);
    }, 0);
    return {
      name: user.name.split(" ")[0],
      Deposits: deposited,
      Loans: borrowed,
    };
  });

  // Collateral utilization
  const maxBorrow = totalDeposited * 0.5;
  const utilization = maxBorrow > 0 ? (totalBorrowed / maxBorrow) * 100 : 0;
  const riskLevel =
    utilization > 80 ? "High" : utilization > 50 ? "Medium" : "Low";

  // Asset distribution for quick stats
  const assetsByType = Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => ({
    type,
    label: config.label,
    total: assets?.filter((a) => a.type === type).reduce((s, a) => s + a.value, 0) ?? 0,
  }));

  // Top users by deposit
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Financial Overview
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Global performance metrics for assets and loans.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Total Assets Deposited"
          value={formatCurrency(totalDeposited)}
          icon="mdi:wallet"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatsCard
          label="Total Borrowed"
          value={formatCurrency(totalBorrowed)}
          icon="mdi:arrow-down-circle"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatsCard
          label="Platform Net Yield"
          value={formatCurrency(netYield)}
          icon="mdi:percent"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          label="Total Users"
          value={String(userCount)}
          icon="mdi:account-group"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Charts & Risk Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-6">
            Assets vs Loans by User
          </h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No data yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="Deposits"
                    fill="#c7d2fe"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Loans"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-200" />
              <span className="text-sm text-slate-500">Deposits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-sm text-slate-500">Borrowed</span>
            </div>
          </div>
        </div>

        {/* Risk Factor Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400 opacity-10 rounded-full -ml-5 -mb-5 blur-xl" />

          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Risk Factor</p>
              <h3 className="text-3xl font-semibold mt-1 tracking-tight">
                {riskLevel}
              </h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg">
              <Icon icon="mdi:pulse" className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="mt-8 z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-indigo-100 text-sm">
                Collateral Utilization
              </span>
              <span className="font-semibold">{utilization.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>

            <div className="mt-6 space-y-3">
              {assetsByType.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-indigo-100">
                    <Icon
                      icon={ASSET_TYPE_CONFIG[item.type].icon}
                      className="w-4 h-4"
                    />
                    {item.label}
                  </span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-900">Top Users</h3>
          <Link
            href="/users"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all
          </Link>
        </div>
        {topUsers.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            No users yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Assets</th>
                  <th className="px-6 py-4">Loans</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {topUsers.map((user) => {
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatCurrency(user.deposited)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatCurrency(user.borrowed)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/users/${user.id}`}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
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
