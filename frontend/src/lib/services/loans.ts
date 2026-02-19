// lib/services/loans.ts
import api from "@/lib/api"
import type {
  Loan,
  RequestLoanPayload,
  RepayLoanPayload,
  BatchRepaymentItem
} from "@/types"

// -------------------------
// GET /loans
// -------------------------
export async function getLoans(): Promise<Loan[]> {
  const { data } = await api.get<Loan[]>("/loans")
  return data
}

// -------------------------
// GET /loans by userId
// -------------------------
export async function getUserLoans(userId: string): Promise<Loan[]> {
  const loans = await getLoans()
  return loans.filter((l) => l.user_id === userId)
}

// -------------------------
// POST /borrow
// -------------------------
export async function requestLoan(payload: RequestLoanPayload): Promise<Loan> {
  const { data } = await api.post<Loan>("/borrow", payload)
  return data
}

// -------------------------
// POST /repay/{loanId}
// -------------------------
export async function repayLoan(payload: RepayLoanPayload): Promise<Loan> {
  const { data } = await api.post<Loan>(`/repay/${payload.loanId}`, {
    amount: payload.amount
  })
  return data
}

// -------------------------
// POST /repay/batch
// -------------------------
export async function repayLoansBatch(
  items: BatchRepaymentItem[]
): Promise<Loan[]> {
  const { data } = await api.post<Loan[]>("/repay/batch", items)
  return data
}
