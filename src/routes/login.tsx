import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth, type Role } from "@/lib/auth";
import { GraduationCap, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"gsm" | "otp">("gsm");
  const [gsm, setGsm] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("Öğrenci");

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (gsm.replace(/\D/g, "").length < 10) {
      toast.error("Geçerli bir GSM girin");
      return;
    }
    setStep("otp");
    toast.success("OTP gönderildi (demo: 1234)");
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234") {
      toast.error("OTP hatalı. Demo kodu: 1234");
      return;
    }
    login(gsm, role);
    toast.success("Giriş başarılı");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="flex justify-center mb-6">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient shadow-glow">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold font-display text-center">EduCell'e Hoş Geldin</h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        Turkcell GSM numaranla giriş yap. Demo OTP: <span className="font-mono font-semibold">1234</span>
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        {step === "gsm" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <Label htmlFor="gsm" className="flex items-center gap-1.5 mb-1.5">
                <Smartphone className="h-3.5 w-3.5" /> GSM Numarası
              </Label>
              <Input
                id="gsm"
                placeholder="+90 5__ ___ __ __"
                value={gsm}
                onChange={(e) => setGsm(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Rol (demo)</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["Öğrenci", "Eğitmen", "Admin"] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              OTP Gönder
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <div className="text-center">
              <ShieldCheck className="h-8 w-8 mx-auto text-brand" />
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{gsm}</span> numarasına gönderilen kodu gir.
              </p>
            </div>
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
            <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
              Doğrula ve Giriş Yap
            </Button>
            <button
              type="button"
              onClick={() => setStep("gsm")}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              ← GSM'yi değiştir
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        <Link to="/" className="hover:text-foreground">Ana sayfaya dön</Link>
      </p>
    </div>
  );
}
