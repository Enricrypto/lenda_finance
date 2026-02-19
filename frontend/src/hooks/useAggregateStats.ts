import { useUsers } from "./useUsers"
import { useAssets } from "./useAssets"
import { useLoans } from "./useLoans"

export function useAggregateStats() {
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { data: loans, isLoading: loansLoading } = useLoans()

  const isLoading = usersLoading || assetsLoading || loansLoading

  const totalDeposited = assets?.reduce((sum, a) => sum + a.value, 0) ?? 0

  const totalBorrowed =
    loans?.reduce((sum, l) => {
      if (l.status === "repaid") return sum
      return sum + Math.max(l.amount - l.amount_repaid, 0)
    }, 0) ?? 0

  const totalRepaid = loans?.reduce((sum, l) => sum + l.amount_repaid, 0) ?? 0

  const userCount = users?.length ?? 0
  const loanCount = loans?.length ?? 0

  const grossYield = totalDeposited * 0.05
  const interestOwed = totalBorrowed * 0.05
  const netYield = grossYield - interestOwed

  const avgLoanPerUser = userCount > 0 ? totalBorrowed / userCount : 0

  return {
    isLoading,
    totalDeposited,
    totalBorrowed,
    totalRepaid,
    netYield,
    userCount,
    loanCount,
    avgLoanPerUser,
    users,
    assets,
    loans
  }
}
