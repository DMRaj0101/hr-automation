import { backendApiClient } from "./backend-api-client";
import { LoginPayload, User } from "@/types/auth";

interface LoginResponse {
  access_token: string;
  role: string;
}

export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await backendApiClient.post<LoginResponse>("/auth/login", {
    email: payload.email,
    password: payload.password,
  });

  // Store token if needed for future authenticated requests
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.access_token);
  }

  return {
    id: Math.random(), // POC only -- backend doesn't return user ID
    email: payload.email,
    name: payload.email.split("@")[0], // Use email prefix as name for POC
    role: data.role,
  };
}