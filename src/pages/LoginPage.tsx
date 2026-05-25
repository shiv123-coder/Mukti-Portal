import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Briefcase, User, AlertCircle, Eye, EyeOff, ShieldCheck, Zap, Sparkles } from "lucide-react";

const LoginPage = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup State
  const [signupStep, setSignupStep] = useState<"role" | "method" | "credentials" | "otp">("role");
  const [role, setRole] = useState<UserRole>("worker");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const { user, login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const navLocation = useLocation();
  const from = (navLocation.state as any)?.from?.pathname || null;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      const path = user.role === "admin" ? "/admin/dashboard" : (user.role === "worker" ? "/dashboard" : "/customer");
      navigate(path, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleSignIn = async () => {
    try {
      setLoadingAction(true);
      await signInWithGoogle(role);
    } catch (err: any) {
      console.error("LoginPage Google Sign-In Error:", err);
      setLoadingAction(false);
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        return;
      }
      setLoginError(`Google Sign-In failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    if (loginPhone.length === 10 && loginPassword) {
      setLoadingAction(true);
      try {
        await login(loginPhone, loginPassword);
      } catch (err: any) {
        setLoadingAction(false);
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          setLoginError("Invalid credentials or account not found.");
        } else {
          setLoginError("Failed to log in. Please try again.");
        }
      }
    }
  };

  const handleSignupCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10 && password) {
      setSignupStep("otp");
    }
  };

  const handleSignupOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      setLoadingAction(true);
      try {
        await signup(phone, role, role === "customer" ? "Customer" : "Worker", password);
      } catch (err: any) {
        setLoadingAction(false);
        setLoginError(`Signup failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#020617] text-white selection:bg-primary/30">
      {/* LEFT PANE - Brand & Value Prop (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-white/5">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="font-serif text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
            MuktiPortal
          </h1>
          <p className="mt-4 text-lg font-medium text-slate-400 max-w-md">
            The decentralized trust network connecting skilled informal workers with verified opportunities.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-200">Verified Trust</h3>
              <p className="text-sm text-slate-500 mt-1">Every worker and employer is cryptographically verified for maximum security.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-200">Instant Matching</h3>
              <p className="text-sm text-slate-500 mt-1">Our ML engine connects you with the right opportunities in real-time.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-200">Build Your Reputation</h3>
              <p className="text-sm text-slate-500 mt-1">Earn badges, points, and unlock premium tiers as you complete jobs.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-bold uppercase tracking-widest text-slate-600">
          © 2026 Mukti Foundation
        </div>
      </div>

      {/* RIGHT PANE - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="lg:hidden absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-accent/20 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[420px] z-10">
          
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-serif text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              MuktiPortal
            </h1>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl animate-fade-up">
            
            {authMode === "login" ? (
              <div className="w-full animate-fade-in">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back</h2>
                <p className="text-sm text-slate-400 mb-8 font-medium">Log in to your account to continue.</p>
                
                {loginError && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-semibold text-red-400 animate-shake">
                    <AlertCircle size={18} />
                    <p>{loginError}</p>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                  <div className="relative group">
                    <input
                      type="tel"
                      maxLength={10}
                      value={loginPhone}
                      onChange={(e) => {
                        setLoginPhone(e.target.value.replace(/\D/g, ""));
                        setLoginError("");
                      }}
                      placeholder="Phone number"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      autoFocus
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 group-focus-within:text-primary transition-colors">
                      +91
                    </span>
                  </div>

                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError("");
                      }}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loginPhone.length !== 10 || !loginPassword || loadingAction}
                    className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                  >
                    {loadingAction ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Authenticating...
                      </span>
                    ) : "Log In"}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or continue with</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loadingAction}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Google
                </button>
              </div>
            ) : (
              <div className="w-full animate-fade-in">
                {signupStep === "role" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Join Mukti</h2>
                      <p className="text-sm text-slate-400 font-medium">Select your account type to get started.</p>
                    </div>

                    <button
                      onClick={() => { setRole("worker"); setSignupStep("method"); }}
                      className="group flex w-full items-center gap-5 rounded-3xl border border-white/10 bg-black/40 p-5 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
                    >
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-lg group-hover:shadow-primary/50 transition-all">
                        <Briefcase size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-white group-hover:text-primary transition-colors">I am a Worker</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Find verified jobs & build your reputation.</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => { setRole("customer"); setSignupStep("method"); }}
                      className="group flex w-full items-center gap-5 rounded-3xl border border-white/10 bg-black/40 p-5 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 active:scale-[0.98]"
                    >
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:shadow-blue-500/50 transition-all">
                        <User size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">I am a Customer</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Hire verified professionals securely.</div>
                      </div>
                    </button>
                  </div>
                )}

                {signupStep === "method" && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Sign up as {role}</h2>
                      <p className="text-sm text-slate-400 font-medium">Choose how you want to create your account.</p>
                    </div>
                    
                    <button
                      onClick={() => setSignupStep("credentials")}
                      className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98]"
                    >
                      Continue with Phone Number
                    </button>

                    <div className="my-6 flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-white/10" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
                      <div className="h-[1px] flex-1 bg-white/10" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loadingAction}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                      Continue with Google
                    </button>
                  </div>
                )}

                {signupStep === "credentials" && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h2>
                      <p className="text-sm text-slate-400 font-medium">Enter your details to receive an OTP.</p>
                    </div>

                    <form onSubmit={handleSignupCredentialsSubmit} className="space-y-4">
                      <div className="relative group">
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="Phone number"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10"
                          autoFocus
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 group-focus-within:text-primary transition-colors">
                          +91
                        </span>
                      </div>

                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create Password"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={phone.length !== 10 || !password}
                        className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 mt-2"
                      >
                        Send OTP
                      </button>
                    </form>
                  </div>
                )}

                {signupStep === "otp" && (
                  <div className="space-y-6 animate-fade-in text-center">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Verify Phone</h2>
                      <p className="text-sm text-slate-400 font-medium">We sent a 4-digit code to +91 {phone}</p>
                    </div>

                    <form onSubmit={handleSignupOtpSubmit} className="space-y-6">
                      <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            type="tel"
                            maxLength={1}
                            value={otp[i] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              const newOtp = otp.split("");
                              newOtp[i] = val;
                              setOtp(newOtp.join(""));
                              if (val && e.target.nextElementSibling) {
                                (e.target.nextElementSibling as HTMLInputElement).focus();
                              }
                            }}
                            className="h-14 w-14 rounded-2xl border border-white/10 bg-black/40 text-center text-2xl font-black text-white outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-black/60"
                            autoFocus={i === 0}
                            required
                          />
                        ))}
                      </div>

                      {loginError && <p className="text-red-400 text-sm font-semibold">{loginError}</p>}

                      <button
                        type="submit"
                        disabled={otp.length < 4 || loadingAction}
                        className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                      >
                        {loadingAction ? "Verifying..." : "Confirm & Continue"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm font-medium">
            {authMode === "login" ? (
              <p className="text-slate-400">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setSignupStep("role");
                    setPhone(""); setPassword("");
                  }}
                  className="font-bold text-white hover:text-primary transition-colors ml-1 underline decoration-white/20 underline-offset-4"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setLoginPhone(""); setLoginPassword(""); setLoginError("");
                  }}
                  className="font-bold text-white hover:text-primary transition-colors ml-1 underline decoration-white/20 underline-offset-4"
                >
                  Log in here
                </button>
              </p>
            )}
          </div>
          
          {authMode === "signup" && signupStep !== "role" && (
            <div className="mt-6 flex justify-center text-xs">
              <button
                 onClick={() => { setSignupStep("role"); setPassword(""); setPhone(""); setOtp(""); }}
                 className="font-bold text-slate-500 hover:text-white transition-colors"
              >
                 ← Choose a different role
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
