import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Phone, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  const sendOtp = () => {
    setOtpSent(true);
    toast({ title: "OTP sent", description: "Use 123456 to verify (demo)" });
  };

  const verifyOtp = () => {
    if (otp === "123456") navigate("/");
    else toast({ title: "Invalid OTP", description: "Try 123456", variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-subtle" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="w-full max-w-md p-7 md:p-8 rounded-2xl shadow-elevated border-border relative animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-md mb-3">
            <span className="text-primary-foreground font-display font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-display font-semibold">Welcome to Homyns</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded-xl h-11 mb-5">
            <TabsTrigger value="password" className="rounded-lg">Password</TabsTrigger>
            <TabsTrigger value="otp" className="rounded-lg">OTP</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Mobile / Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input required defaultValue="arjun@homyns.in" className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input required type={show ? "text" : "password"} defaultValue="demo1234" className="pl-10 pr-10 h-11 rounded-xl" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl">Sign In</Button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            <div className="space-y-4">
              <div>
                <Label>Mobile Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue="+91 98765 43210" className="pl-10 h-11 rounded-xl" disabled={otpSent} />
                </div>
              </div>
              {!otpSent ? (
                <Button onClick={sendOtp} className="w-full h-11 rounded-xl">Send OTP</Button>
              ) : (
                <>
                  <div>
                    <Label>Enter OTP (demo: 123456)</Label>
                    <div className="relative mt-1.5">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="pl-10 h-11 rounded-xl tracking-[0.4em] font-semibold" placeholder="------" />
                    </div>
                  </div>
                  <Button onClick={verifyOtp} className="w-full h-11 rounded-xl">Verify & Login</Button>
                  <button onClick={() => setOtpSent(false)} className="text-xs text-primary hover:underline w-full text-center">Change number</button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
        </p>
      </Card>
    </div>
  );
}
