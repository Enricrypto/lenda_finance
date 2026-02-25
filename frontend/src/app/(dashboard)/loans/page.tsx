"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useLoans, useEvaluateLoan, useRequestLoan, useRepayLoan } from "@/hooks/useLoans";
import { useMyPosition } from "@/hooks/usePositions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import LoanStatusBadge from "@/components/shared/LoanStatusBadge";
import StatsCard from "@/components/shared/StatsCard";
import Modal from "@/components/shared/Modal";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { AxiosError } from "axios";
import { toast } from "sonner";
import type { LoanEvaluation } from "@/types";

const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();
  const { data: position } = useMyPosition();
  const evaluateLoan = useEvaluateLoan();
  const requestLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanError, setLoanError] = useState("");
  const [evaluation, setEvaluation] = useState<LoanEvaluation | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [repayModal, setRepayModal] = useState<{ loanId: string; remaining: number } | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");

  const filtered = statusFilter === "all" ? loans : loans?.filter((l) => l.status === statusFilter);
  const totalOutstanding = loans?.reduce((s, l) => l.status === "active" ? s + Math.max(l.amount - (l.amount_repaid ?? 0), 0) + (l.accrued_interest ?? 0) : s, 0) ?? 0;
  const totalRepaid = loans?.reduce((s, l) => s + (l.amount_repaid ?? 0), 0) ?? 0;
  const activeLoanCount = loans?.filter((l) => l.status === "active").length ?? 0;

  const handleEvaluate = () => {
    setLoanError("");
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) { setLoanError("Amount must be positive"); return; }
    evaluateLoan.mutate(
      { amount },
      {
        onSuccess: (data) => { setEvaluation(data); setShowEvalModal(true); },
        onError: (err) => {
          const msg = (err as AxiosError<{ detail: string }>).response?.data?.detail || "Evaluation failed";
          setLoanError(msg);
        },
      }
    );
  };

  const handleConfirmLoan = () => {
    const amount = parseFloat(loanAmount);
    requestLoan.mutate(
      { amount },
      {
        onSuccess: (loan) => {
          setShowEvalModal(false); setEvaluation(null); setLoanAmount("");
          if (loan.status === "active") toast.success("Loan approved and disbursed");
          else toast.error(`Loan rejected: ${loan.rejection_reason}`);
        },
        onError: (err) => {
          const msg = (err as AxiosError<{ detail: string }>).response?.data?.detail || "Failed to request loan";
          toast.error(msg); setShowEvalModal(false);
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
      { loanId: repayModal.loanId, amount },
      {
        onSuccess: () => { setRepayModal(null); setRepayAmount(""); toast.success("Payment applied"); },
        onError: (err) => {
          const msg = (err as AxiosError<{ detail: string }>).response?.data?.detail || "Failed to repay";
          setRepayError(msg); toast.error(msg);
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
        <StatsCard label="Outstanding Debt" value={formatCurrency(totalOutstanding)} icon="mdi:cash-clock"         iconBg="bg-orange-500/10"  iconColor="text-orange-400" />
        <StatsCard label="Total Repaid"      value={formatCurrency(totalRepaid)}      icon="mdi:cash-check"         iconBg="bg-emerald-500/10" iconColor="text-emerald-400" />
        <StatsCard label="Active Loans"      value={String(activeLoanCount)}          icon="mdi:file-document-outline" iconBg="bg-blue-500/10" iconColor="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center bg-surface border border-white/6 rounded-lg p-1 w-fit">
            {["all", "active", "repaid", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${statusFilter === s ? "bg-white/8 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
            {!filtered?.length ? <EmptyState title="No loans" /> : (
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
                      <th className="px-6 py-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-sm">
                    {filtered.map((loan) => {
                      const remaining = Math.max(loan.amount - (loan.amount_repaid ?? 0), 0) + (loan.accrued_interest ?? 0);
                      return (
                        <tr key={loan.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-6 py-4 text-zinc-300">{formatCurrency(loan.amount)}</td>
                          <td className="px-6 py-4 text-emerald-400">{formatCurrency(loan.amount_repaid)}</td>
                          <td className="px-6 py-4 text-amber-400">{formatCurrency(loan.accrued_interest)}</td>
                          <td className="px-6 py-4 text-zinc-500">{loan.ltv_at_origination !== null ? formatPercent(loan.ltv_at_origination) : "—"}</td>
                          <td className="px-6 py-4"><LoanStatusBadge status={loan.status} /></td>
                          <td className="px-6 py-4 text-zinc-500">{formatDate(loan.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            {loan.status === "active" && remaining > 0 && (
                              <button onClick={() => setRepayModal({ loanId: loan.id, remaining })}
                                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer transition-colors">
                                Repay
                              </button>
                            )}
                            {loan.status === "rejected" && loan.rejection_reason && (
                              <span className="text-xs text-zinc-600">{loan.rejection_reason}</span>
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
                  <p className="text-xs text-amber-400/80">Interest rate: <span className="font-semibold text-amber-400">5.0% p.a.</span> simple interest. Loan is evaluated against your collateral before approval.</p>
                </div>
              </div>
              {loanError && <p className="text-xs text-red-400">{loanError}</p>}
              <button onClick={handleEvaluate} disabled={evaluateLoan.isPending}
                className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                {evaluateLoan.isPending ? "Evaluating..." : "Evaluate & Request"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loan evaluation modal */}
      <Modal open={showEvalModal} onClose={() => { setShowEvalModal(false); setEvaluation(null); }} title="Loan Evaluation">
        {evaluation && (
          <div className="space-y-4">
            <div className={`rounded-lg p-3 border ${evaluation.approved ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <div className="flex items-center gap-2">
                <Icon icon={evaluation.approved ? "mdi:check-circle" : "mdi:close-circle"} className={`w-5 h-5 ${evaluation.approved ? "text-emerald-400" : "text-red-400"}`} />
                <span className={`font-medium text-sm ${evaluation.approved ? "text-emerald-400" : "text-red-400"}`}>
                  {evaluation.approved ? "Loan Approved" : "Loan Rejected"}
                </span>
              </div>
              {!evaluation.approved && evaluation.rejection_reason && (
                <p className="text-xs text-red-400/80 mt-2 ml-7">{evaluation.rejection_reason}</p>
              )}
            </div>

            <div className="bg-white/4 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Requested Amount</span>
                <span className="text-white">{formatCurrency(evaluation.requested_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Eligible Collateral</span>
                <span className="text-white">{formatCurrency(evaluation.total_eligible_collateral)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Current Debt</span>
                <span className="text-white">{formatCurrency(evaluation.outstanding_debt)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/6 pt-3">
                <span className="text-zinc-400">Projected LTV</span>
                <span className={evaluation.projected_ltv > 0.8 ? "text-red-400" : "text-white"}>{evaluation.projected_ltv < 99 ? formatPercent(evaluation.projected_ltv) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Health Factor</span>
                <span className={evaluation.health_factor < 1.2 ? "text-amber-400" : "text-emerald-400"}>{evaluation.health_factor < 99 ? evaluation.health_factor.toFixed(2) : "∞"}</span>
              </div>
            </div>

            {evaluation.approved ? (
              <div className="flex gap-3">
                <button onClick={() => { setShowEvalModal(false); setEvaluation(null); }}
                  className="flex-1 bg-white/6 hover:bg-white/10 border border-white/8 text-zinc-300 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleConfirmLoan} disabled={requestLoan.isPending}
                  className="flex-1 bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                  {requestLoan.isPending ? "Requesting..." : "Confirm Loan"}
                </button>
              </div>
            ) : (
              <button onClick={() => { setShowEvalModal(false); setEvaluation(null); }}
                className="w-full bg-white/6 hover:bg-white/10 border border-white/8 text-zinc-300 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer">
                Close
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Repay modal */}
      <Modal open={!!repayModal} onClose={() => { setRepayModal(null); setRepayAmount(""); setRepayError(""); }} title="Repay Loan">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Total outstanding: <span className="font-medium text-white">{formatCurrency(repayModal?.remaining ?? 0)}</span></p>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Repayment Amount</label>
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
