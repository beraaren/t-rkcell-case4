import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
        path === to || path.startsWith(to + "/")
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-accent-foreground" />
          </div>
          <span>EduCell</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            {navLink("/courses", "Katalog")}
            {user.role === "STUDENT" && navLink("/my-courses", "Kurslarım")}
            {user.role === "INSTRUCTOR" && navLink("/instructor", "Eğitmen Panel")}
            {user.role === "ADMIN" && navLink("/admin", "Admin")}
            {navLink("/profile", "Profil")}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                {user.name}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { logout(); nav({ to: "/login" }); }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Giriş</Link></Button>
              <Button asChild size="sm"><Link to="/register">Kayıt Ol</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
