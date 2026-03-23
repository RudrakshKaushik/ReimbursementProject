import React, { createContext, useContext, useEffect, useState } from "react";
import { checkAuth } from "@/api/client";

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthContextType = {
  authStatus: AuthStatus;
  setAuthStatus: (status: AuthStatus) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("unknown");
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";


  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {

        if (BYPASS_AUTH) {
            if (!cancelled) setAuthStatus("authenticated");
            return;
        }

        const authed = await checkAuth();
        if (!cancelled) {
          setAuthStatus(authed ? "authenticated" : "unauthenticated");
        }
      } catch {
        if (!cancelled) setAuthStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authStatus, setAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}