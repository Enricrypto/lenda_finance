import api from "@/lib/api"
import type { User, CreateUserPayload } from "@/types"

// Fetch all users
export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users")
  return data
}

// Fetch a single user by ID
export async function getUserById(userId: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${userId}`)
  return data
}

// Create a new user
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>("/users", payload)
  return data
}
