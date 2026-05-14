import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Phone, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, verifyOtp, pendingOtp } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [gsm, setGsm] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(gsm, password);
      setStep("otp");
      toast.success("Doğrulama kodu gönderildi");
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const onOtp = async () => {
    if (!pendingOtp) return;
    setLoading(true);
    try {
      const u = await verifyOtp(pendingOtp.gsm, otp);
      toast.success(`Hoşgeldin, ${u.name}`);
      if (u.role === "ADMIN") nav({ to: "/admin" });
      else if (u.role === "INSTRUCTOR") nav({ to: "/instructor" });
      else nav({ to: "/courses" });
    } catch (err: any) {
      toast.error(err.message);
      setOtp("");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sol panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-600 to-violet-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold">EduCell</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Kariyer yolculuğuna<br />buradan başla.
          </h1>
          <p className="text-white/70 text-lg">
            Uzman eğitmenlerden öğren, modül sınavlarını geç, sertifikanı kazan.
          </p>
          <div className="space-y-3">
            {[
              "Zamanlı modül sınavları",
              "Otomatik sertifika üretimi",
              "Kişisel ilerleme takibi",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/40 text-sm">© 2026 EduCell · Turkcell CodeNight</div>
      </div>

      {/* Sağ panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">EduCell</span>
          </div>

          {step === "creds" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Giriş Yap</h2>
                <p className="text-muted-foreground mt-1">Hesabınla devam et</p>
              </div>

              <form onSubmit={onCreds} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gsm">GSM Numarası</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="gsm"
                      value={gsm}
                      onChange={(e) => setGsm(e.target.value)}
                      placeholder="05XXXXXXXXX"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Şifre</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                  {loading ? "Giriş yapılıyor…" : "Devam Et"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground">
                Hesabın yok mu?{" "}
                <Link to="/register" className="text-violet-600 font-medium hover:underline">
                  Kayıt ol
                </Link>
              </p>

              <div className="border rounded-lg p-4 bg-muted/40 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demo Hesaplar</p>
                <div className="grid gap-1.5">
                  {[
                    { label: "Öğrenci", gsm: "05554445566" },
                    { label: "Eğitmen", gsm: "05551112233" },
                    { label: "Admin", gsm: "05557778899" },
                  ].map((d) => (
                    <button
                      key={d.gsm}
                      type="button"
                      onClick={() => { setGsm(d.gsm); setPassword("Test1234"); }}
                      className="flex justify-between items-center text-xs px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className="font-mono text-muted-foreground">{d.gsm}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Şifre: <span className="font-mono">Test1234</span> · OTP: <span className="font-mono">1234</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold">Kodu Doğrula</h2>
                <p className="text-muted-foreground mt-1">
                  <span className="font-mono font-semibold text-foreground">{pendingOtp?.gsm}</span> numarasına gönderilen 4 haneli kodu gir.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Demo için: <span className="font-mono font-semibold">1234</span>
                </p>

                <Button
                  onClick={onOtp}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={otp.length !== 4 || loading}
                >
                  {loading ? "Doğrulanıyor…" : "Giriş Yap"}
                </Button>

                <Button variant="ghost" className="w-full" onClick={() => { setStep("creds"); setOtp(""); }}>
                  Geri Dön
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
