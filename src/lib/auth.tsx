import * as React from "react";

export type Role = "Öğrenci" | "Eğitmen" | "Admin";

export interface AuthUser {
  id: string;
  name: string;
  gsm: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (gsm: string, role: Role, name?: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const Ctx = React.createContext<AuthCtx | null>(null);
const KEY = "educell.auth.v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
      else {
        // demo otomatik giriş
        const demo: AuthUser = {
          id: "u-demo",
          name: "Demo Öğrenci",
          gsm: "+90 555 000 00 00",
          role: "Öğrenci",
        };
        setUser(demo);
        localStorage.setItem(KEY, JSON.stringify(demo));
      }
    } catch {
      /* noop */
    }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  };

  const value: AuthCtx = {
    user,
    login: (gsm, role, name) =>
      persist({
        id: "u-" + gsm.slice(-4),
        name: name || (role === "Eğitmen" ? "Eğitmen Demo" : role === "Admin" ? "Admin Demo" : "Demo Öğrenci"),
        gsm,
        role,
      }),
    logout: () => persist(null),
    switchRole: (role) => user && persist({ ...user, role, name: role === "Eğitmen" ? "Eğitmen Demo" : role === "Admin" ? "Admin Demo" : "Demo Öğrenci" }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
