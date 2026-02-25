import { useQuery } from "@tanstack/react-query";
import { getMyPosition } from "@/lib/services/positions";

export function useMyPosition() {
  return useQuery({ queryKey: ["position"], queryFn: getMyPosition });
}
