import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/services/users";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: getMe });
}
