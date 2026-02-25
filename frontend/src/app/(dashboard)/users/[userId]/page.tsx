"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useUser } from "@/hooks/useUsers";
import { useUserAssets, useCreateAsset } from "@/hooks/useAssets";
import { useUserLoans, useRequestLoan, useRepayLoan } from "@/hooks/useLoans";
import { useUserPosition } from "@/hooks/usePositions";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import LoanStatusBadge from "@/components/shared/LoanStatusBadge";
import AssetTypeIcon from "@/components/shared/AssetTypeIcon";
import Modal from "@/components/shared/Modal";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { ASSET_TYPES } from "@/lib/constants";
import { AxiosError } from "axios";
import { toast } from "sonner";

const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: assets, isLoading: assetsLoading } = useUserAssets(userId);
  const { data: loans, isLoading: loansLoading } = useUserLoans(userId);
  const { data: position } = useUserPosition(userId);

  const createAsset = useCreateAsset();
  const requestLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  const [assetType, setAssetType] = useState("property");
  const [assetValue, setAssetValue] = useState("");
  const [assetError, setAssetError] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanError, setLoanError] = useState("");
  const [repayModal, setRepayModal] = useState<{ loanId: string; remaining: number } | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");

  const handleAddAsset = () => {
    setAssetError("");
    const value = parseFloat(assetValue);
    if (!value || value <= 0) { setAssetError("Value must be positive"); return; }
    createAsset.mutate(
      { user_id: userId, type: assetType, value },
      {
        onSuccess: () => { setAssetValue(""); toast.success("Asset added successfully"); },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to add asset";
          setAssetError(message); toast.error(message);
        },
      }
    );
  };

  const handleRequestLoan = () => {
    setLoanError("");
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) { setLoanError("Amount must be positive"); return; }
    requestLoan.mutate(
      { user_id: userId, amount },
      {
        onSuccess: () => { setLoanAmount(""); toast.success("Loan requested successfully"); },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to request loan";
          setLoanError(message); toast.error(message);
        },
      }
    );
  };

  const handleRepay = () => {
    if (!repayModal) return;
    setRepayError("");
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) { setRepayError("Amount must be positive"); return; }
    repayLoan.mutate(
      { loanId: repayModal.loanId, amount, userId },
      {
        onSuccess: () => { setRepayModal(null); setRepayAmount(""); toast.success("Loan repaid successfully"); },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to repay loan";
          setRepayError(message); toast.error(message);
        },
      }
    );
  };

  if (userLoading) return <LoadingSpinner />;
  if (!user) return <EmptyState title="User not found" />;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{user.name}</h1>
        <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Deposited" value={formatCurrency(position?.total_deposited ?? 0)} icon="mdi:wallet" iconBg="bg-cyan-500/10" iconColor="text-cyan-400" />
        <StatsCard label="Total Borrowed" value={formatCurrency(position?.total_borrowed ?? 0)} icon="mdi:arrow-down-circle" iconBg="bg-orange-500/10" iconColor="text-orange-400" />
        <StatsCard label="Available Credit" value={formatCurrency(position?.available_credit ?? 0)} icon="mdi:credit-card" iconBg="bg-blue-500/10" iconColor="text-blue-400" />
        <StatsCard label="Net Yield" value={formatCurrency(position?.yield_earned ?? 0)} icon="mdi:percent" iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Assets Table */}
          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Assets</h3>
            </div>
            {assetsLoading ? <LoadingSpinner /> : !assets?.length ? (
              <EmptyState title="No assets" description="Add an asset to start." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Value</th>
                      <th className="px-6 py-4 font-medium">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-sm">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/3 transition-colors">
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

          {/* Loans Table */}
          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Loans</h3>
            </div>
            {loansLoading ? <LoadingSpinner /> : !loans?.length ? (
              <EmptyState title="No loans" description="Request a loan to start." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Repaid</th>
                      <th className="px-6 py-4 font-medium">Remaining</th>
                      <th className="px-6 py-4 font-medium">Rate</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-sm">
                    {loans.map((loan) => {
                      const remaining = Math.max(loan.amount - loan.amount_repaid, 0);
                      return (
                        <tr key={loan.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-6 py-4 text-zinc-300">{formatCurrency(loan.amount)}</td>
                          <td className="px-6 py-4 text-emerald-400">{formatCurrency(loan.amount_repaid)}</td>
                          <td className="px-6 py-4 text-zinc-500">{formatCurrency(remaining)}</td>
                          <td className="px-6 py-4 text-zinc-500">{formatPercent(loan.interest_rate)}</td>
                          <td className="px-6 py-4"><LoanStatusBadge status={loan.status} /></td>
                          <td className="px-6 py-4 text-zinc-500">{formatDate(loan.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            {loan.status === "approved" && remaining > 0 && (
                              <button onClick={() => setRepayModal({ loanId: loan.id, remaining })}
                                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer transition-colors">
                                Repay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Side forms */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-white/6 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-cyan-500/10 rounded-lg"><Icon icon="mdi:plus" className="w-5 h-5 text-cyan-400" /></div>
              <h3 className="font-medium text-white">Add New Asset</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Asset Type</label>
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={INPUT_CLASS}>
                  {ASSET_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Value ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
                  <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              {assetError && <p className="text-xs text-red-400">{assetError}</p>}
              <button onClick={handleAddAsset} disabled={createAsset.isPending}
                className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                {createAsset.isPending ? "Adding..." : "Add Asset"}
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-white/6 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Icon icon="mdi:arrow-right-left" className="w-5 h-5 text-blue-400" /></div>
              <h3 className="font-medium text-white">Request Loan</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
                  <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
                </div>
                <p className="text-xs text-zinc-600 mt-1">Available: {formatCurrency(position?.available_credit ?? 0)}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/80 leading-relaxed">Interest rate is <span className="font-semibold text-amber-400">5.0%</span>. Max borrow is 50% of total assets.</p>
                </div>
              </div>
              {loanError && <p className="text-xs text-red-400">{loanError}</p>}
              <button onClick={handleRequestLoan} disabled={requestLoan.isPending}
                className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                {requestLoan.isPending ? "Requesting..." : "Request Loan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!repayModal} onClose={() => { setRepayModal(null); setRepayAmount(""); setRepayError(""); }} title="Repay Loan">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Remaining debt: <span className="font-medium text-white">{formatCurrency(repayModal?.remaining ?? 0)}</span></p>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Repayment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
              <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" max={repayModal?.remaining} step="0.01" />
            </div>
          </div>
          {repayError && <p className="text-xs text-red-400">{repayError}</p>}
          <div className="flex gap-3">
            <button onClick={() => { if (repayModal) setRepayAmount(String(repayModal.remaining)); }}
              className="flex-1 bg-white/6 hover:bg-white/10 border border-white/8 text-zinc-300 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
              Pay Full
            </button>
            <button onClick={handleRepay} disabled={repayLoan.isPending}
              className="flex-1 bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
              {repayLoan.isPending ? "Paying..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
