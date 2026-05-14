import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { admin as adminApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function AdminPanel() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const loadData = () => {
    adminApi.stats().then(setStats).catch(() => {});
    adminApi.users().then(setUsers).catch(() => {});
    adminApi.courses().then(setCourses).catch(() => {});
  };

  useEffect(() => {
    if (!loading && user?.role === "ADMIN") loadData();
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN") return <Navigate to="/courses" />;

  const updateRole = async (id: string, role: string) => {
    try {
      await adminApi.updateRole(id, role);
      toast.success("Rol güncellendi");
      adminApi.users().then(setUsers).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const archiveCourse = async (id: string) => {
    try {
      await adminApi.archiveCourse(id);
      toast.success("Kurs arşivlendi");
      adminApi.courses().then(setCourses).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Kullanıcı</div><div className="text-2xl font-bold">{stats.users ?? stats.totalUsers ?? 0}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Kurs</div><div className="text-2xl font-bold">{stats.courses ?? stats.totalCourses ?? 0}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Kayıt</div><div className="text-2xl font-bold">{stats.enrollments ?? stats.totalEnrollments ?? 0}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Sertifika</div><div className="text-2xl font-bold">{stats.certificates ?? stats.totalCertificates ?? 0}</div></Card>
          </div>
        )}

        <Card className="p-6">
          <h2 className="font-semibold mb-3">Kullanıcılar</h2>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Ad</TableHead><TableHead>GSM</TableHead><TableHead>Rol</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.gsm}</TableCell>
                  <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                      <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">STUDENT</SelectItem>
                        <SelectItem value="INSTRUCTOR">INSTRUCTOR</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-3">Kurslar</h2>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Başlık</TableHead><TableHead>Durum</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  <TableCell>
                    {c.status !== "ARCHIVED" && (
                      <Button size="sm" variant="destructive" onClick={() => archiveCourse(c.id)}>Arşivle</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
