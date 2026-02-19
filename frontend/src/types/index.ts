export interface User {
  id: string
  name: string
  email: string
}

export interface Asset {
  id: string
  user_id: string
  type: "property" | "crypto" | "car"
  value: number
  created_at: string
}

export interface Loan {
  id: string
  user_id: string
  amount: number
  amount_repaid: number
  interest_rate: number
  status: "pending" | "approved" | "repaid"
  created_at: string
}

export interface Position {
  user_id: string
  total_deposited: number
  total_borrowed: number
  available_credit: number
  yield_earned: number
}

export interface CreateAssetPayload {
  user_id: string
  type: string
  value: number
}

export interface RequestLoanPayload {
  user_id: string
  amount: number
}

export interface RepayLoanPayload {
  loanId: string // ID of the loan to repay
  userId: string // needed for query invalidation
  amount: number // repayment amount
}

export interface BatchRepaymentItem {
  loan_id: string
  amount: number
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
}
