"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useLoans, useRequestLoan, useRepayLoan } from "@/hooks/useLoans";
import { useUsers } from "@/hooks/useUsers";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import LoanStatusBadge from "@/components/shared/LoanStatusBadge";
import Modal from "@/components/shared/Modal";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { AxiosError } from "axios";
import { toast } from "sonner";

const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();
  const { data: users } = useUsers();
  const requestLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userId, setUserId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanError, setLoanError] = useState("");
  const [repayModal, setRepayModal] = useState<{ loanId: string; remaining: number; userId: string } | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");

  const userMap = new Map(users?.map((u) => [u.id, u.name]) ?? []);
  const filtered = statusFilter === "all" ? loans : loans?.filter((l) => l.status === statusFilter);
  const totalOutstanding = loans?.reduce((sum, l) => {
    if (l.status === "repaid") return sum;
    return sum + Math.max(l.amount - l.amount_repaid, 0);
  }, 0) ?? 0;
  const totalRepaid = loans?.reduce((sum, l) => sum + l.amount_repaid, 0) ?? 0;
  const activeLoanCount = loans?.filter((l) => l.status === "approved").length ?? 0;

  const handleRequestLoan = () => {
    setLoanError("");
    const amount = parseFloat(loanAmount);
    if (!userId) { setLoanError("Please select a user"); return; }
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
      { loanId: repayModal.loanId, amount, userId: repayModal.userId },
      {
        onSuccess: () => { setRepayModal(null); setRepayAmount(""); toast.success("Loan repaid successfully"); },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to repay";
          setRepayError(message); toast.error(message);
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Loans</h1>
        <p className="text-sm text-zinc-500 mt-1">{loans?.length ?? 0} total loans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Outstanding Debt" value={formatCurrency(totalOutstanding)} icon="mdi:cash-clock" iconBg="bg-orange-500/10" iconColor="text-orange-400" />
        <StatsCard label="Total Repaid" value={formatCurrency(totalRepaid)} icon="mdi:cash-check" iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        <StatsCard label="Active Loans" value={String(activeLoanCount)} icon="mdi:file-document-outline" iconBg="bg-blue-500/10" iconColor="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center bg-surface border border-white/6 rounded-lg p-1 w-fit">
            {["all", "approved", "repaid"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${statusFilter === s ? "bg-white/8 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            {!filtered?.length ? <EmptyState title="No loans found" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
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
                    {filtered.map((loan) => {
                      const remaining = Math.max(loan.amount - loan.amount_repaid, 0);
                      return (
                        <tr key={loan.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{userMap.get(loan.user_id) ?? "Unknown"}</td>
                          <td className="px-6 py-4 text-zinc-300">{formatCurrency(loan.amount)}</td>
                          <td className="px-6 py-4 text-emerald-400">{formatCurrency(loan.amount_repaid)}</td>
                          <td className="px-6 py-4 text-zinc-500">{formatCurrency(remaining)}</td>
                          <td className="px-6 py-4 text-zinc-500">{formatPercent(loan.interest_rate)}</td>
                          <td className="px-6 py-4"><LoanStatusBadge status={loan.status} /></td>
                          <td className="px-6 py-4 text-zinc-500">{formatDate(loan.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            {loan.status === "approved" && remaining > 0 && (
                              <button onClick={() => setRepayModal({ loanId: loan.id, remaining, userId: loan.user_id })}
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

        <div>
          <div className="bg-surface rounded-xl border border-white/6 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Icon icon="mdi:arrow-right-left" className="w-5 h-5 text-blue-400" /></div>
              <h3 className="font-medium text-white">Request Loan</h3>
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
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
                  <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/80">Interest rate: <span className="font-semibold text-amber-400">5.0%</span>. Max borrow: 50% of user&apos;s total assets.</p>
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
          <p className="text-sm text-zinc-500">Remaining: <span className="font-medium text-white">{formatCurrency(repayModal?.remaining ?? 0)}</span></p>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">$</span>
              <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className={INPUT_CLASS + " pl-6"} placeholder="0.00" min="0" step="0.01" />
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
