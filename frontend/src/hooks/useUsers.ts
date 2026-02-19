import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, getUserById, createUser } from "@/lib/services/users"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    }
  })
}
