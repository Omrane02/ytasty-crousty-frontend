import axiosInstance from "./axiosInstance";
import type { LoginRequest, TokenResponse, UserCreate, UserRead } from "../types/auth";

export async function requestLogin(credentials: LoginRequest): Promise<TokenResponse> {
  const { data } = await axiosInstance.post<TokenResponse>("/auth/login", credentials);
  return data;
}

export async function createUser(payload: UserCreate): Promise<UserRead> {
  const { data } = await axiosInstance.post<UserRead>("/users", payload);
  return data;
}