import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, Search, LogOut, ShieldCheck, BookOpen, Users } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const roleIcon = {
  Öğrenci: BookOpen,
  Eğitmen: Users,
  Admin: ShieldCheck,
} as const;

export function Navbar() {
  const { user, switchRole, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const linkCls = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">EduCell</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Turkcell Akademi
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={linkCls(path === "/")}>Katalog</Link>
          <Link to="/dashboard" className={linkCls(path.startsWith("/dashboard"))}>
            Panelim
          </Link>
          {user?.role === "Eğitmen" && (
            <Link to="/instructor" className={linkCls(path.startsWith("/instructor"))}>
              Eğitmen
            </Link>
          )}
          {user?.role === "Admin" && (
            <Link to="/admin" className={linkCls(path.startsWith("/admin"))}>
              Admin
            </Link>
          )}
          <Link to="/verify" className={linkCls(path.startsWith("/verify"))}>
            Sertifika Doğrula
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Kurs, eğitmen, kategori ara…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground text-xs font-bold">
                    {user.name[0]}
                  </span>
                  <span className="hidden sm:inline">{user.name}</span>
                  <Badge variant="secondary" className="ml-1">{user.role}</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Rol değiştir (demo)</DropdownMenuLabel>
                {(["Öğrenci", "Eğitmen", "Admin"] as Role[]).map((r) => {
                  const Icon = roleIcon[r];
                  return (
                    <DropdownMenuItem key={r} onClick={() => switchRole(r)}>
                      <Icon className="mr-2 h-4 w-4" /> {r}
                      {user.role === r && (
                        <span className="ml-auto text-xs text-muted-foreground">aktif</span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Çıkış
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/login">Giriş Yap</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
