import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leaderboard as lbApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lbApi.get(50).then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const medalColors: Record<number, string> = {
    1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
    2: "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
    3: "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Liderlik Tablosu</h1>
            <p className="text-sm text-muted-foreground">
              Tamamlanan kurs sayısı ve sınav doğruluk oranının harmonik ortalaması
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">Yükleniyor...</Card>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Henüz sıralama yok. İlk olan sen ol!</p>
          </Card>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3">
                {top3.map((r) => (
                  <Card key={r.userId} className={`p-5 space-y-2 ${user?.id === r.userId ? "ring-2 ring-violet-500" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${medalColors[r.rank] ?? "bg-muted"}`}>
                        {r.rank}
                      </div>
                      {r.rank === 1 && <Medal className="w-6 h-6 text-yellow-500" />}
                    </div>
                    <div className="font-semibold text-lg">{r.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Kurs</div>
                        <div className="font-semibold tabular-nums">{r.completedCourses}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Doğruluk</div>
                        <div className="font-semibold tabular-nums">%{r.accuracy}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Skor</div>
                        <div className="font-semibold tabular-nums text-violet-600">{r.score}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-16">Sıra</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead className="text-right">Tamamlanan Kurs</TableHead>
                    <TableHead className="text-right">Doğruluk</TableHead>
                    <TableHead className="text-right">Harmonik Skor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rest.map((r) => (
                    <TableRow key={r.userId} className={user?.id === r.userId ? "bg-violet-50 dark:bg-violet-950/20" : ""}>
                      <TableCell className="font-bold tabular-nums">{r.rank}</TableCell>
                      <TableCell>
                        <span className="font-medium">{r.name}</span>
                        {user?.id === r.userId && <Badge variant="secondary" className="ml-2 text-[10px]">Sen</Badge>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5 text-violet-500" /> {r.completedCourses}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">%{r.accuracy}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-violet-600">
                        <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {r.score}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
