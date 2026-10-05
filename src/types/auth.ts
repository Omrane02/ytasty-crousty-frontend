export const ROLES =["admin", "staff", "direction"] as const;

export type Role = (typeof ROLES)[number];

export interface AuthUser {
    username: string;
    role: Role;
    restaurant_id: number | null;
}

export function isRole(value: unknown): value is Role {
    return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  role: Role;
  restaurant_id: number | null;
}

export interface UserRead {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  restaurant_id: number | null;
}