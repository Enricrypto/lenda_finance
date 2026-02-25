import api from "@/lib/api";
import type { Asset, AssetPreview, CreateAssetPayload } from "@/types";

export async function getAssets(): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets");
  return data;
}

export async function previewAsset(payload: CreateAssetPayload): Promise<AssetPreview> {
  const { data } = await api.post<AssetPreview>("/assets/preview", payload);
  return data;
}

export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  const { data } = await api.post<Asset>("/assets", payload);
  return data;
}
