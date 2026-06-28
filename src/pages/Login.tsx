// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Building2,
  User,
  KeyRound,
  CheckCircle2,
  Loader2,
  MailCheck,
  Building,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Company Code, 2: Login
  const [companyCode, setCompanyCode] = useState("");
  const [companyValid, setCompanyValid] = useState(false);
  const [loginData, setLoginData] = useState({
    login_code: "",
    password: "",
  });
  const [resendTimer, setResendTimer] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://sunshineproduct.in/interior_designer/v1_api/";

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user_data");
    if (token && user) {
      navigate("/");
    }
  }, [navigate]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Verify Company Code
  const verifyCompanyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter company code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}login.php`, {
        type: 1,
        company_code: companyCode,
      });

      if (response.data.status === "success") {
        setCompanyValid(true);
        setCompanyName(response.data.company?.company_name || "");
        setCompanyLogo(response.data.company?.logo || "");
        setStep(2);
        toast({
          title: "Company Verified",
          description: `Welcome to ${response.data.company?.company_name || "Track Desk"}`,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Invalid company code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Company verification error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.login_code || !loginData.password) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}login.php`, {
        type: 1,
        company_code: companyCode,
        login_code: loginData.login_code,
        password: loginData.password,
      });

      if (response.data.status === "success") {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user_data", JSON.stringify(response.data.user));
        localStorage.setItem(
          "company_data",
          JSON.stringify(response.data.company)
        );
        toast({ title: "Welcome Back!", description: "Login successful" });
        navigate("/");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Password login error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send OTP - User enters Login Code, OTP sent to registered email
  const sendOtp = async () => {
    if (!loginData.login_code) {
      toast({
        title: "Error",
        description: "Please enter your login code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}login.php`, {
        type: 2,
        company_code: companyCode,
        login_code: loginData.login_code, // Send login_code to find user
      });

      if (response.data.status === "success") {
        setOtpSent(true);
        const sentTo = response.data.email || loginData.login_code;
        setOtpSentTo(sentTo);
        setResendTimer(30);
        toast({
          title: "OTP Sent Successfully!",
          description: response.data.otp
            ? `Demo OTP: ${response.data.otp}`
            : `OTP sent to your registered email`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Error",
        description: "Please enter valid OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}login.php`, {
        type: 3,
        company_code: companyCode,
        otp: otp,
        login_code: loginData.login_code, // Use login_code to find user
      });

      if (response.data.status === "success") {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user_data", JSON.stringify(response.data.user));
        localStorage.setItem(
          "company_data",
          JSON.stringify(response.data.company)
        );
        toast({
          title: "Welcome Back!",
          description: "Login successful",
        });
        navigate("/");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Company Code Screen
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-200/20 blur-3xl animate-pulse" />

        <Card className="w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/50 bg-white/95 backdrop-blur-sm relative animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
              <span className="text-white font-display font-bold text-3xl">
                TR
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Welcome to Track Desk
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your company code to continue
            </p>
          </div>

          <form onSubmit={verifyCompanyCode} className="space-y-5">
            <div>
              <Label htmlFor="companyCode" className="text-sm font-medium text-slate-700">
                Company Code
              </Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="companyCode"
                  required
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  placeholder="Enter company code"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Enter your company's unique code
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Building className="w-5 h-5" />
                  Verify Company
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Powered by{" "}
              <a
                href="https://www.sunshineinfotech.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Sunshine Infotech
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-200/20 blur-3xl animate-pulse" />

      <Card className="w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/50 bg-white/95 backdrop-blur-sm relative animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-20 h-20 rounded-2xl object-contain shadow-xl shadow-indigo-500/20 mb-4 bg-white p-2"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
              <span className="text-white font-display font-bold text-3xl">
                {companyName.charAt(0) || "TR"}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {companyName || "Track Desk"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account
          </p>
          <button
            onClick={() => {
              setStep(1);
              setCompanyValid(false);
              setCompanyCode("");
              setCompanyName("");
              setCompanyLogo("");
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline mt-2 flex items-center gap-1 transition-all"
            type="button"
          >
            <Building2 className="w-3 h-3" />
            Change company
          </button>
        </div>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded-xl h-12 p-1 bg-slate-100 mb-6">
            <TabsTrigger
              value="password"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all data-[state=active]:text-indigo-600"
            >
              <Lock className="w-4 h-4 mr-2" />
              Password
            </TabsTrigger>
            <TabsTrigger
              value="otp"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all data-[state=active]:text-indigo-600"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              OTP
            </TabsTrigger>
          </TabsList>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="loginCode" className="text-sm font-medium text-slate-700">
                  Login Code
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="loginCode"
                    required
                    value={loginData.login_code}
                    onChange={(e) =>
                      setLoginData({ ...loginData, login_code: e.target.value })
                    }
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    placeholder="Enter login code"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="pl-10 pr-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* OTP Tab - User enters Login Code, OTP sent to Email */}
          <TabsContent value="otp" className="space-y-4">
            <div className="space-y-4">
              {/* Info message */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <MailCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Enter your login code. We'll send the OTP to your registered email address.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="otpLoginCode" className="text-sm font-medium text-slate-700">
                  Login Code <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="otpLoginCode"
                    value={loginData.login_code}
                    onChange={(e) =>
                      setLoginData({ ...loginData, login_code: e.target.value })
                    }
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    placeholder="Enter login code"
                    disabled={otpSent || loading}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Enter the login code registered with your account
                </p>
              </div>

              {!otpSent ? (
                <Button
                  onClick={sendOtp}
                  className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                  disabled={loading || !loginData.login_code}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailCheck className="w-5 h-5" />
                      Send OTP to Email
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {/* OTP Sent Message */}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-indigo-900">
                          OTP Sent Successfully
                        </p>
                        <p className="text-xs text-indigo-600/80 mt-0.5">
                          We've sent a verification code to your registered email
                        </p>
                        {otpSentTo && (
                          <p className="text-xs text-indigo-700 font-medium mt-1">
                            📧 {otpSentTo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="otpInput" className="text-sm font-medium text-slate-700">
                      Enter OTP
                    </Label>
                    <div className="relative mt-1.5">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="otpInput"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        maxLength={6}
                        className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-center text-lg tracking-[0.4em] font-semibold"
                        placeholder="------"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Enter the 6-digit OTP sent to your email
                    </p>
                  </div>

                  <Button
                    onClick={verifyOtp}
                    className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                    disabled={loading || !otp || otp.length < 4}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Verify & Login
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setOtpSentTo("");
                        setLoginData({ ...loginData, login_code: "" });
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                      type="button"
                      disabled={loading}
                    >
                      Change login code
                    </button>
                    <button
                      onClick={sendOtp}
                      className={`text-xs font-medium transition-colors ${
                        resendTimer > 0
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-indigo-600 hover:text-indigo-700 hover:underline"
                      }`}
                      type="button"
                      disabled={loading || resendTimer > 0}
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Powered by{" "}
            <a
              href="https://www.sunshineinfotech.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Sunshine Infotech
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}