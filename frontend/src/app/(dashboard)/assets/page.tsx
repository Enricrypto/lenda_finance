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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

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

  const filtered =
    filter === "all"
      ? assets
      : assets?.filter((a) => a.type === filter);

  const pieData = ASSET_TYPES.map((type) => ({
    name: ASSET_TYPE_CONFIG[type].label,
    value: assets?.filter((a) => a.type === type).reduce((s, a) => s + a.value, 0) ?? 0,
  })).filter((d) => d.value > 0);

  const handleAdd = () => {
    setFormError("");
    const value = parseFloat(assetValue);
    if (!userId) {
      setFormError("Please select a user");
      return;
    }
    if (!value || value <= 0) {
      setFormError("Value must be positive");
      return;
    }
    createAsset.mutate(
      { user_id: userId, type: assetType, value },
      {
        onSuccess: () => {
          setAssetValue("");
          toast.success("Asset added successfully");
        },
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Assets</h1>
        <p className="text-sm text-slate-500 mt-1">
          {assets?.length ?? 0} assets across all users
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table + Chart */}
        <div className="xl:col-span-2 space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit">
            {["all", ...ASSET_TYPES].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  filter === type
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {!filtered?.length ? (
              <EmptyState title="No assets found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filtered.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {userMap.get(asset.user_id) ?? "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <AssetTypeIcon type={asset.type} />
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {formatCurrency(asset.value)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(asset.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">
                Asset Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Add Asset Form */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Icon icon="mdi:plus" className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-slate-900">Add New Asset</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">User</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600"
                >
                  <option value="">Select user...</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600"
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Value ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                onClick={handleAdd}
                disabled={createAsset.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
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
