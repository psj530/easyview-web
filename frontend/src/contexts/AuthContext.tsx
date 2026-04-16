"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getToken,
  getUser,
  getCompanies,
  clearAuth,
  type User,
  type Company,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  companies: Company[];
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companies: [],
  isAuthenticated: false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login", "/"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();
    if (token) {
      setUser(getUser());
      setCompanies(getCompanies());
    } else if (!PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    }
    setChecked(true);
  }, [pathname, router]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setCompanies([]);
    router.push("/login");
  }, [router]);

  // Don't render protected pages until auth check completes
  if (!checked) {
    return null;
  }

  // If not authenticated and on a protected page, show nothing (redirect happening)
  if (!getToken() && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        companies,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
