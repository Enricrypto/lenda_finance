import api from "@/lib/api";
import type { Loan, LoanEvaluation, RequestLoanPayload, RepayLoanPayload } from "@/types";

export async function getLoans(): Promise<Loan[]> {
  const { data } = await api.get<Loan[]>("/loans");
  return data;
}

export async function evaluateLoan(payload: RequestLoanPayload): Promise<LoanEvaluation> {
  const { data } = await api.post<LoanEvaluation>("/loans/evaluate", payload);
  return data;
}

export async function requestLoan(payload: RequestLoanPayload): Promise<Loan> {
  const { data } = await api.post<Loan>("/loans", payload);
  return data;
}

export async function repayLoan(payload: RepayLoanPayload): Promise<Loan> {
  const { data } = await api.post<Loan>(`/loans/${payload.loanId}/repay`, {
    amount: payload.amount,
  });
  return data;
}
