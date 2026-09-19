"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getAccessToken, setAccessToken } from "@/lib/token";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      if (getAccessToken()) {
        const me = await api.get<{ user: User }>("/api/auth/me");
        if (me.success) {
          setUser(me.data.user);
          setLoading(false);
          return;
        }
      }
      const refresh = await api.post<{ access_token: string }>("/api/auth/refresh");
      if (refresh.success) {
        setAccessToken(refresh.data.access_token);
        const me = await api.get<{ user: User }>("/api/auth/me");
        if (me.success) setUser(me.data.user);
      }
      setLoading(false);
    }
    void boot();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const res = await api.post<{ access_token: string; user: User }>("/api/auth/login", {
          email,
          password,
        });
        if (!res.success) return res.error;
        setAccessToken(res.data.access_token);
        setUser(res.data.user);
        return null;
      },
      register: async (username, email, password) => {
        const res = await api.post<{ access_token: string; user: User }>(
          "/api/auth/register",
          { username, email, password },
        );
        if (!res.success) return res.error;
        setAccessToken(res.data.access_token);
        setUser(res.data.user);
        return null;
      },
      logout: async () => {
        await api.post("/api/auth/logout");
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
