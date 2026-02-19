import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAssets, createAsset } from "@/lib/services/assets"

// Fetch all assets
export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: getAssets
  })
}

// Filter assets for a specific user
export function useUserAssets(userId: string) {
  const { data: allAssets, ...rest } = useAssets()
  const filtered = allAssets?.filter((a) => a.user_id === userId)
  return { data: filtered, ...rest }
}

// Create a new asset
export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAsset,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.user_id]
      })
    }
  })
}
