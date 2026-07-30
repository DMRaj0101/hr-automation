import { apiClient } from "./api-client";
import { LoginPayload, User } from "@/types/auth";

interface SeedUser extends User {
  password: string;
}

export async function login(payload: LoginPayload): Promise<User> {
  const { data: users } = await apiClient.get<SeedUser[]>("/users");
  const match = users.find(
    (u) => u.email === payload.email && u.password === payload.password
  );
  if (!match) {
    throw new Error("Invalid email or password");
  }
  const { password: _password, ...user } = match;
  return user;
}
