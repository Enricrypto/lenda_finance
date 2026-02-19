// src/hooks/useLoans.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as loansService from "@/lib/services/loans"

// -------------------------
// Fetch all loans
// -------------------------
export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: loansService.getLoans
  })
}

// -------------------------
// Fetch loans for a single user
// -------------------------
export function useUserLoans(userId: string) {
  return useQuery({
    queryKey: ["loans", userId],
    queryFn: () => loansService.getUserLoans(userId),
    enabled: !!userId
  })
}

// -------------------------
// Request a loan
// -------------------------
export function useRequestLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loansService.requestLoan,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.user_id]
      })
    }
  })
}

// -------------------------
// Repay a single loan
// -------------------------
export function useRepayLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loansService.repayLoan,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.userId]
      })
    }
  })
}

// -------------------------
// Repay multiple loans
// -------------------------
export function useRepayLoansBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loansService.repayLoansBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({ queryKey: ["positions"] })
    }
  })
}
