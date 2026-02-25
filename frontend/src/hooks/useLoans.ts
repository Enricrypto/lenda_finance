import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as loansService from "@/lib/services/loans";
import type { RequestLoanPayload } from "@/types";

export function useLoans() {
  return useQuery({ queryKey: ["loans"], queryFn: loansService.getLoans });
}

export function useEvaluateLoan() {
  return useMutation({
    mutationFn: (p: RequestLoanPayload) => loansService.evaluateLoan(p),
  });
}

export function useRequestLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loansService.requestLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["position"] });
    },
  });
}

export function useRepayLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loansService.repayLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["position"] });
    },
  });
}
