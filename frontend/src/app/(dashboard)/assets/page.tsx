"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useAssets, usePreviewAsset, useCreateAsset } from "@/hooks/useAssets";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import AssetTypeIcon from "@/components/shared/AssetTypeIcon";
import Modal from "@/components/shared/Modal";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { ASSET_TYPES, ASSET_TYPE_CONFIG } from "@/lib/constants";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type { AssetPreview } from "@/types";

const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  const previewAsset = usePreviewAsset();
  const createAsset = useCreateAsset();

  const [filter, setFilter] = useState<string>("all");
  const [assetType, setAssetType] = useState("property");
  const [statedValue, setStatedValue] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState<AssetPreview | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const filtered = filter === "all" ? assets : assets?.filter((a) => a.type === filter);

  const handlePreview = () => {
    setFormError("");
    const val = parseFloat(statedValue);
    if (!val || val <= 0) { setFormError("Value must be positive"); return; }
    previewAsset.mutate(
      { type: assetType, stated_value: val, description: description || undefined },
      {
        onSuccess: (data) => { setPreview(data); setShowConfirm(true); },
        onError: (err) => {
          const msg = (err as AxiosError<{ detail: string }>).response?.data?.detail || "Preview failed";
          setFormError(msg);
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!preview) return;
    createAsset.mutate(
      { type: assetType, stated_value: parseFloat(statedValue), description: description || undefined },
      {
        onSuccess: () => {
          setShowConfirm(false); setPreview(null); setStatedValue(""); setDescription("");
          toast.success("Asset added as collateral");
        },
        onError: (err) => {
          const msg = (err as AxiosError<{ detail: string }>).response?.data?.detail || "Failed to add asset";
          toast.error(msg);
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Assets</h1>
        <p className="text-sm text-zinc-500 mt-1">{assets?.length ?? 0} collateral assets</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center bg-surface border border-white/6 rounded-lg p-1 w-fit">
            {["all", ...ASSET_TYPES].map((type) => (
              <button key={type} onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${filter === type ? "bg-white/8 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {type === "all" ? "All" : ASSET_TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            {!filtered?.length ? <EmptyState title="No assets" description="Add collateral to start borrowing." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Description</th>
                      <th className="px-6 py-4 font-medium">Stated Value</th>
                      <th className="px-6 py-4 font-medium">Eligible Collateral</th>
                      <th className="px-6 py-4 font-medium">LTV</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-sm">
                    {filtered.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4 text-zinc-300"><AssetTypeIcon type={asset.type} /></td>
                        <td className="px-6 py-4 text-zinc-500">{asset.description || "—"}</td>
                        <td className="px-6 py-4 text-zinc-300">{formatCurrency(asset.stated_value)}</td>
                        <td className="px-6 py-4 text-cyan-400">{formatCurrency(asset.appraised_value)}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatPercent(asset.ltv_ratio)}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatDate(asset.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Asset Form */}
        <div>
          <div className="bg-surface rounded-xl border border-white/6 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon icon="mdi:plus" className="w-5 h-5 text-cyan-400" /></div>
              <h3 className="font-medium text-white">Add Collateral</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Asset Type</label>
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={INPUT_CLASS}>
                  {ASSET_TYPES.map((t) => <option key={t} value={t}>{ASSET_TYPE_CONFIG[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_CLASS} placeholder="e.g. Tesla Model 3 2022" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Market Value ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
                  <input type="number" value={statedValue} onChange={(e) => setStatedValue(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400/80 space-y-1">
                <p>LTV rates: <span className="font-medium text-blue-400">Property 70% · Crypto 50% · Car 60%</span></p>
                <p>You can borrow up to your eligible collateral amount.</p>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <button onClick={handlePreview} disabled={previewAsset.isPending}
                className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                {previewAsset.isPending ? "Evaluating..." : "Preview & Add"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Valuation confirmation modal */}
      <Modal open={showConfirm} onClose={() => { setShowConfirm(false); setPreview(null); }} title="Confirm Collateral">
        {preview && (
          <div className="space-y-4">
            <div className="bg-white/4 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Asset Type</span>
                <span className="text-white capitalize">{preview.asset_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Stated Value</span>
                <span className="text-white">{formatCurrency(preview.stated_value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">LTV Ratio</span>
                <span className="text-white">{formatPercent(preview.ltv_ratio)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/6 pt-3">
                <span className="text-zinc-400 font-medium">Eligible Collateral</span>
                <span className="text-cyan-400 font-semibold">{formatCurrency(preview.appraised_value)}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600">This amount will be counted toward your borrowing capacity.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setPreview(null); }}
                className="flex-1 bg-white/6 hover:bg-white/10 border border-white/8 text-zinc-300 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={createAsset.isPending}
                className="flex-1 bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                {createAsset.isPending ? "Adding..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
