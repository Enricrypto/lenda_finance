import api from "@/lib/api";
import type { Position } from "@/types";

export async function getMyPosition(): Promise<Position> {
  const { data } = await api.get<Position>("/position");
  return data;
}
