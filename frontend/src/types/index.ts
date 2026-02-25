export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Asset {
  id: string;
  user_id: string;
  type: "property" | "crypto" | "car";
  description: string | null;
  stated_value: number;
  appraised_value: number;
  ltv_ratio: number;
  status: "active" | "locked" | "rejected";
  created_at: string;
}

export interface AssetPreview {
  asset_type: string;
  stated_value: number;
  ltv_ratio: number;
  appraised_value: number;
  risk_tier: string;
}

export interface Loan {
  id: string;
  user_id: string;
  amount: number;
  amount_repaid: number;
  accrued_interest: number;
  interest_rate: number;
  status: "pending" | "active" | "repaid" | "rejected" | "liquidated";
  ltv_at_origination: number | null;
  health_factor_snapshot: number | null;
  rejection_reason: string | null;
  created_at: string;
  activated_at: string | null;
  repaid_at: string | null;
}

export interface LoanEvaluation {
  approved: boolean;
  requested_amount: number;
  projected_ltv: number;
  health_factor: number;
  total_eligible_collateral: number;
  outstanding_debt: number;
  max_additional_borrow: number;
  rejection_reason: string | null;
}

export interface Position {
  user_id: string;
  total_deposited: number;
  total_eligible_collateral: number;
  total_borrowed: number;
  total_interest: number;
  available_credit: number;
  yield_earned: number;
  health_factor: number | null;
  ltv: number | null;
}

// Request payloads
export interface CreateAssetPayload {
  type: string;
  stated_value: number;
  description?: string;
}

export interface RequestLoanPayload {
  amount: number;
}

export interface RepayLoanPayload {
  loanId: string;
  amount: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
