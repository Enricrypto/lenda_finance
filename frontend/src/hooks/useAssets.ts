import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssets, previewAsset, createAsset } from "@/lib/services/assets";
import type { CreateAssetPayload } from "@/types";

export function useAssets() {
  return useQuery({ queryKey: ["assets"], queryFn: getAssets });
}

export function usePreviewAsset() {
  return useMutation({ mutationFn: (p: CreateAssetPayload) => previewAsset(p) });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["position"] });
    },
  });
}
