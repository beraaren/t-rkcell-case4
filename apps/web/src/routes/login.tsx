import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, verifyOtp, pendingOtp } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [gsm, setGsm] = useState("05554445566");
  const [password, setPassword] = useState("Test1234");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(gsm, password);
      setStep("otp");
      toast.success("OTP kodun gönderildi (demo: 1234)");
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
      nav({ to: "/courses" });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-accent/10">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">EduCell</h1>
        </div>

        {step === "creds" ? (
          <form onSubmit={onCreds} className="space-y-4">
            <div>
              <Label htmlFor="gsm">GSM Numarası</Label>
              <Input id="gsm" value={gsm} onChange={(e) => setGsm(e.target.value)} placeholder="05XXXXXXXXX" required />
            </div>
            <div>
              <Label htmlFor="pw">Şifre</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>Giriş Yap</Button>
            <p className="text-xs text-center text-muted-foreground">
              Hesabın yok mu? <Link to="/register" className="underline">Kayıt ol</Link>
            </p>
            <div className="text-xs text-muted-foreground bg-muted rounded-md p-3 space-y-1">
              <div className="font-semibold">Demo hesaplar (şifre: Test1234, OTP: 1234)</div>
              <div>Öğrenci: 05554445566</div>
              <div>Eğitmen: 05551112233</div>
              <div>Admin: 05557778899</div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {pendingOtp?.gsm} numarasına gönderilen 4 haneli kodu gir. <span className="font-semibold text-foreground">(Demo: 1234)</span>
            </p>
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
            <Button onClick={onOtp} className="w-full" disabled={otp.length !== 4 || loading}>Doğrula</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("creds")}>Geri</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
