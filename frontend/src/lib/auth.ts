/**
 * Auth client utilities for PwC Easy View 3.0
 * Handles login, token storage, and auth state.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

const TOKEN_KEY = "easyview_token";
const USER_KEY = "easyview_user";
const COMPANIES_KEY = "easyview_companies";
const AUTO_LOGIN_KEY = "easyview_auto_login";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string;
}

export interface Company {
  id: number;
  name: string;
  code: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  companies: Company[];
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function getCompanies(): Company[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(COMPANIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getAutoLogin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTO_LOGIN_KEY) === "true";
}

export function setAutoLogin(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(AUTO_LOGIN_KEY, "true");
  } else {
    localStorage.removeItem(AUTO_LOGIN_KEY);
  }
}

export function saveAuth(data: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(data.companies));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANIES_KEY);
  localStorage.removeItem(AUTO_LOGIN_KEY);
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "로그인에 실패했습니다." }));
    throw new Error(error.detail || "로그인에 실패했습니다.");
  }

  const data: LoginResponse = await res.json();
  saveAuth(data);
  return data;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });

  // Token expired or invalid → auto logout and redirect
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=1";
    }
  }

  return res;
}
