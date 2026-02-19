import api from "@/lib/api"
import type { Position } from "@/types"

export async function getUserPosition(userId: string): Promise<Position> {
  const { data } = await api.get<Position>(`/positions/${userId}`)
  return data
}
