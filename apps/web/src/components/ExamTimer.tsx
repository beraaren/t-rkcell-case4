import { useEffect, useState } from "react";

export function ExamTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remainMs, setRemainMs] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemainMs(r);
      if (r === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const totalSec = Math.floor(remainMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const danger = totalSec <= 10;
  const warn = !danger && totalSec <= 30;

  return (
    <div className={`px-4 py-2 rounded-lg font-mono text-lg font-semibold tabular-nums transition-colors ${
      danger ? "bg-destructive text-destructive-foreground animate-pulse"
      : warn ? "bg-warning text-warning-foreground"
      : "bg-foreground text-background"
    }`}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
