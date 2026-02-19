import { useQuery } from "@tanstack/react-query"
import { getUserPosition } from "@/lib/services/positions"

export function useUserPosition(userId: string) {
  return useQuery({
    queryKey: ["positions", userId],
    queryFn: () => getUserPosition(userId),
    enabled: !!userId
  })
}
