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

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: assets, isLoading: assetsLoading } = useUserAssets(userId);
  const { data: loans, isLoading: loansLoading } = useUserLoans(userId);
  const { data: position } = useUserPosition(userId);

  const createAsset = useCreateAsset();
  const requestLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  // Add Asset form state
  const [assetType, setAssetType] = useState("property");
  const [assetValue, setAssetValue] = useState("");
  const [assetError, setAssetError] = useState("");

  // Request Loan form state
  const [loanAmount, setLoanAmount] = useState("");
  const [loanError, setLoanError] = useState("");

  // Repay modal state
  const [repayModal, setRepayModal] = useState<{ loanId: string; remaining: number } | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");

  const handleAddAsset = () => {
    setAssetError("");
    const value = parseFloat(assetValue);
    if (!value || value <= 0) {
      setAssetError("Value must be positive");
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
          setAssetError(message);
          toast.error(message);
        },
      }
    );
  };

  const handleRequestLoan = () => {
    setLoanError("");
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) {
      setLoanError("Amount must be positive");
      return;
    }
    requestLoan.mutate(
      { user_id: userId, amount },
      {
        onSuccess: () => {
          setLoanAmount("");
          toast.success("Loan requested successfully");
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to request loan";
          setLoanError(message);
          toast.error(message);
        },
      }
    );
  };

  const handleRepay = () => {
    if (!repayModal) return;
    setRepayError("");
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) {
      setRepayError("Amount must be positive");
      return;
    }
    repayLoan.mutate(
      { loanId: repayModal.loanId, amount, userId },
      {
        onSuccess: () => {
          setRepayModal(null);
          setRepayAmount("");
          toast.success("Loan repaid successfully");
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to repay loan";
          setRepayError(message);
          toast.error(message);
        },
      }
    );
  };

  if (userLoading) return <LoadingSpinner />;
  if (!user) return <EmptyState title="User not found" />;

  return (
    <>
      {/* User header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {user.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{user.email}</p>
      </div>

      {/* Position stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Total Deposited"
          value={formatCurrency(position?.total_deposited ?? 0)}
          icon="mdi:wallet"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatsCard
          label="Total Borrowed"
          value={formatCurrency(position?.total_borrowed ?? 0)}
          icon="mdi:arrow-down-circle"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatsCard
          label="Available Credit"
          value={formatCurrency(position?.available_credit ?? 0)}
          icon="mdi:credit-card"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          label="Net Yield"
          value={formatCurrency(position?.yield_earned ?? 0)}
          icon="mdi:percent"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assets + Loans tables */}
        <div className="xl:col-span-2 space-y-6">
          {/* Assets Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-medium text-slate-900">Assets</h3>
            </div>
            {assetsLoading ? (
              <LoadingSpinner />
            ) : !assets?.length ? (
              <EmptyState title="No assets" description="Add an asset to start." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
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

          {/* Loans Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-medium text-slate-900">Loans</h3>
            </div>
            {loansLoading ? (
              <LoadingSpinner />
            ) : !loans?.length ? (
              <EmptyState title="No loans" description="Request a loan to start." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Repaid</th>
                      <th className="px-6 py-4">Remaining</th>
                      <th className="px-6 py-4">Rate</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loans.map((loan) => {
                      const remaining = Math.max(loan.amount - loan.amount_repaid, 0);
                      return (
                        <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {formatCurrency(loan.amount)}
                          </td>
                          <td className="px-6 py-4 text-emerald-600">
                            {formatCurrency(loan.amount_repaid)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatPercent(loan.interest_rate)}
                          </td>
                          <td className="px-6 py-4">
                            <LoanStatusBadge status={loan.status} />
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {formatDate(loan.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {loan.status === "approved" && remaining > 0 && (
                              <button
                                onClick={() =>
                                  setRepayModal({ loanId: loan.id, remaining })
                                }
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium cursor-pointer"
                              >
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
          {/* Add Asset Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Icon icon="mdi:plus" className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-slate-900">Add New Asset</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Asset Type
                </label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Value ($)
                </label>
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
              {assetError && <p className="text-xs text-red-600">{assetError}</p>}
              <button
                onClick={handleAddAsset}
                disabled={createAsset.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm shadow-indigo-200 cursor-pointer"
              >
                {createAsset.isPending ? "Adding..." : "Add Asset"}
              </button>
            </div>
          </div>

          {/* Request Loan Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Icon icon="mdi:arrow-right-left" className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-slate-900">Request Loan</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder:text-slate-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Available: {formatCurrency(position?.available_credit ?? 0)}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <div className="flex gap-2">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Interest rate is <span className="font-semibold">5.0%</span>. Max borrow is 50% of total assets.
                  </p>
                </div>
              </div>
              {loanError && <p className="text-xs text-red-600">{loanError}</p>}
              <button
                onClick={handleRequestLoan}
                disabled={requestLoan.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {requestLoan.isPending ? "Requesting..." : "Request Loan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Repay Modal */}
      <Modal
        open={!!repayModal}
        onClose={() => {
          setRepayModal(null);
          setRepayAmount("");
          setRepayError("");
        }}
        title="Repay Loan"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Remaining debt: <span className="font-medium text-slate-900">{formatCurrency(repayModal?.remaining ?? 0)}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Repayment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                placeholder="0.00"
                min="0"
                max={repayModal?.remaining}
                step="0.01"
              />
            </div>
          </div>
          {repayError && <p className="text-xs text-red-600">{repayError}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (repayModal) setRepayAmount(String(repayModal.remaining));
              }}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Pay Full
            </button>
            <button
              onClick={handleRepay}
              disabled={repayLoan.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {repayLoan.isPending ? "Paying..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
