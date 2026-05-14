import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const { register, verifyOtp, pendingOtp } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [gsm, setGsm] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, gsm, password, role });
      setStep("otp");
      toast.success("OTP kodu gönderildi (demo: 1234)");
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const onOtp = async () => {
    if (!pendingOtp) return;
    setLoading(true);
    try {
      const u = await verifyOtp(pendingOtp.gsm, otp);
      toast.success("Kayıt tamamlandı");
      nav({ to: u.role === "INSTRUCTOR" ? "/instructor" : "/courses" });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-accent/10">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-6">Kayıt Ol</h1>
        {step === "form" ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Ad Soyad</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>GSM</Label><Input value={gsm} onChange={(e) => setGsm(e.target.value)} placeholder="05XXXXXXXXX" required /></div>
            <div><Label>Şifre</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <div>
              <Label>Rol</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as "STUDENT" | "INSTRUCTOR")} className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><RadioGroupItem value="STUDENT" /> Öğrenci</label>
                <label className="flex items-center gap-2"><RadioGroupItem value="INSTRUCTOR" /> Eğitmen</label>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>Devam</Button>
            <p className="text-xs text-center text-muted-foreground">
              Zaten hesabın var mı? <Link to="/login" className="underline">Giriş yap</Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">OTP kodu (demo: 1234)</p>
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={onOtp} className="w-full" disabled={otp.length !== 4 || loading}>Doğrula</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
