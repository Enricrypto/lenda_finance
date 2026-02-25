"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useAssets, useCreateAsset } from "@/hooks/useAssets";
import { useUsers } from "@/hooks/useUsers";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import AssetTypeIcon from "@/components/shared/AssetTypeIcon";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ASSET_TYPES, ASSET_TYPE_CONFIG } from "@/lib/constants";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const PIE_COLORS = ["#22d3ee", "#f59e0b", "#10b981"];
const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";
const TOOLTIP_STYLE = { backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "#e4e4e7" };

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  const { data: users } = useUsers();
  const createAsset = useCreateAsset();

  const [filter, setFilter] = useState<string>("all");
  const [userId, setUserId] = useState("");
  const [assetType, setAssetType] = useState("property");
  const [assetValue, setAssetValue] = useState("");
  const [formError, setFormError] = useState("");

  const userMap = new Map(users?.map((u) => [u.id, u.name]) ?? []);
  const filtered = filter === "all" ? assets : assets?.filter((a) => a.type === filter);

  const pieData = ASSET_TYPES.map((type) => ({
    name: ASSET_TYPE_CONFIG[type].label,
    value: assets?.filter((a) => a.type === type).reduce((s, a) => s + a.value, 0) ?? 0,
  })).filter((d) => d.value > 0);

  const handleAdd = () => {
    setFormError("");
    const value = parseFloat(assetValue);
    if (!userId) { setFormError("Please select a user"); return; }
    if (!value || value <= 0) { setFormError("Value must be positive"); return; }
    createAsset.mutate(
      { user_id: userId, type: assetType, value },
      {
        onSuccess: () => { setAssetValue(""); toast.success("Asset added successfully"); },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to add asset";
          setFormError(message);
          toast.error(message);
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Assets</h1>
        <p className="text-sm text-zinc-500 mt-1">{assets?.length ?? 0} assets across all users</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center bg-surface border border-white/6 rounded-lg p-1 w-fit">
            {["all", ...ASSET_TYPES].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  filter === type ? "bg-white/8 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            {!filtered?.length ? (
              <EmptyState title="No assets found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Value</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-sm">
                    {filtered.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{userMap.get(asset.user_id) ?? "Unknown"}</td>
                        <td className="px-6 py-4 text-zinc-300"><AssetTypeIcon type={asset.type} /></td>
                        <td className="px-6 py-4 text-zinc-300">{formatCurrency(asset.value)}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatDate(asset.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="bg-surface rounded-xl border border-white/6 p-6">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Asset Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={TOOLTIP_STYLE} />
                    <Legend formatter={(value) => <span style={{ color: "#71717a" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Add Asset Form */}
        <div>
          <div className="bg-surface rounded-xl border border-white/6 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Icon icon="mdi:plus" className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-medium text-white">Add New Asset</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">User</label>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className={INPUT_CLASS}>
                  <option value="">Select user...</option>
                  {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Type</label>
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={INPUT_CLASS}>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Value ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
                  <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <button
                onClick={handleAdd}
                disabled={createAsset.isPending}
                className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {createAsset.isPending ? "Adding..." : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
