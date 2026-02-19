import api from "@/lib/api"
import type { Asset, CreateAssetPayload } from "@/types"

// Fetch all assets
export async function getAssets(): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets")
  return data
}

// Create a new asset
export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  const { data } = await api.post<Asset>("/assets", payload)
  return data
}
