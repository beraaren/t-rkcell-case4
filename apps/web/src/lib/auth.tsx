import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth as authApi, setToken, setRefreshToken, clearTokens } from "./api";

export interface User {
  id: string;
  gsm: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  bio?: string;
}

interface PendingOtp {
  gsm: string;
  password: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  pendingOtp: PendingOtp | null;
  login: (gsm: string, password: string) => Promise<void>;
  verifyOtp: (gsm: string, code: string) => Promise<User>;
  register: (i: { gsm: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState<PendingOtp | null>(null);

  const refresh = useCallback(async () => {
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("educell:token");
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => { clearTokens(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (gsm: string, password: string) => {
    await authApi.login(gsm, password);
    setPendingOtp({ gsm, password });
  };

  const verifyOtp = async (gsm: string, code: string): Promise<User> => {
    const data = await authApi.verifyOtp(gsm, code);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    const u = await authApi.me();
    setUser(u);
    setPendingOtp(null);
    return u;
  };

  const register = async (i: { gsm: string; password: string; name: string; role: string }) => {
    await authApi.register(i);
    setPendingOtp({ gsm: i.gsm, password: i.password });
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setPendingOtp(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, pendingOtp, login, verifyOtp, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
