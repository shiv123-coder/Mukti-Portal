import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Briefcase, User, AlertCircle, Eye, EyeOff, ShieldCheck, Zap, Sparkles, Camera, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { uploadProfileImage } from "@/utils/storage";

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const LoginPage = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup State (Wizard)
  const [signupStep, setSignupStep] = useState<"role" | "method" | "details" | "profile" | "otp">("role");
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Signup Form Data
  const [role, setRole] = useState<UserRole>("worker");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Optional Profile Data
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  
  const { user, login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const navLocation = useLocation();
  const from = (navLocation.state as any)?.from?.pathname || null;

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

  const handleGoogleSignInSuccess = async (tokenResponse: any) => {
    try {
      setLoadingAction(true);
      await signInWithGoogle(role, tokenResponse.access_token);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setLoadingAction(false);
      setLoginError(`Google Sign-In failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: handleGoogleSignInSuccess,
    onError: () => setLoginError("Google Sign-In failed or was cancelled.")
  });

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

  const validateDetails = () => {
    if (!name || !username || !email || phone.length !== 10) return false;
    if (password.length < 6 || password !== confirmPassword) return false;
    if (!termsAccepted) return false;
    return true;
  };

  const handleSignupDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDetails()) {
      setSignupStep("profile"); // Move to optional profile step
    }
  };

  const handleSignupProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupStep("otp"); // Move to OTP
  };

  const handleSignupOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      setLoadingAction(true);
      try {
        // Construct user data
        const userData: any = {
          role,
          phone,
          name,
          username,
          email,
          gender: gender || undefined,
          dob: dob || undefined,
          organization: organization || undefined,
          bio: bio || undefined,
          location: address || undefined,
        };

        await signup(userData, password);

        // If avatar is selected, upload it after signup creates the account
        // Wait, signup sets user context and triggers redirect. Let's upload before redirect if possible,
        // or we handle upload inside the profile edit page.
        // Actually, if we use signup it logs us in immediately, so we can upload the photo right after.
        
      } catch (err: any) {
        setLoadingAction(false);
        setLoginError(`Signup failed: ${err.message}`);
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const passwordStrength = Math.min(100, (password.length / 10) * 100);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* LEFT PANE - Premium Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-14 bg-[#09090b] border-r border-border">
        {/* Modern Gradients */}
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/20">
              <span className="text-2xl font-black italic">M</span>
            </div>
            <h1 className="font-serif text-3xl font-black tracking-tighter text-white">Mukti</h1>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white/90 leading-[1.1] max-w-lg mt-12">
            The decentralized trust network connecting skilled workers with verified opportunities.
          </h2>
          <p className="mt-6 text-lg text-white/60 max-w-md leading-relaxed">
            Join thousands of professionals securing their future with cryptographic verification and ML-driven matching.
          </p>
        </div>

        <div className="relative z-10 space-y-8 mb-12">
          {[
            { icon: ShieldCheck, title: "Verified Trust", desc: "Every profile is cryptographically verified for security." },
            { icon: Zap, title: "Instant Matching", desc: "Our engine connects you with opportunities in real-time." },
            { icon: Sparkles, title: "Build Reputation", desc: "Earn badges and unlock premium tiers securely." }
          ].map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              key={i} 
              className="flex items-start gap-5 group"
            >
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                <item.icon size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90">{item.title}</h3>
                <p className="text-sm text-white/50 mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-xs font-bold uppercase tracking-widest text-white/30">
          © 2026 Mukti Foundation
        </div>
      </div>

      {/* RIGHT PANE - Auth Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-background">
        <div className="w-full max-w-[440px] z-10">
          
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/20">
              <span className="text-xl font-black italic">M</span>
            </div>
            <h1 className="font-serif text-2xl font-black tracking-tighter text-foreground">Mukti</h1>
          </div>

          <AnimatePresence mode="wait">
            {authMode === "login" ? (
              <motion.div 
                key="login"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-card border border-border p-8 sm:p-10 rounded-[2rem] shadow-2xl"
              >
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Welcome back</h2>
                <p className="text-sm text-muted-foreground mb-8">Enter your credentials to access your account.</p>
                
                {loginError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive">
                    <AlertCircle size={18} />
                    <p>{loginError}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Phone Number</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={loginPhone}
                        onChange={(e) => { setLoginPhone(e.target.value.replace(/\D/g, "")); setLoginError(""); }}
                        className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        placeholder="00000 00000"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Password</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginPhone.length !== 10 || !loginPassword || loadingAction}
                    className="w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-bold shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6"
                  >
                    {loadingAction ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Log In"}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or</span>
                  <div className="h-[1px] flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loadingAction}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-card hover:bg-accent py-3.5 text-sm font-semibold text-foreground transition-all active:scale-[0.98]"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  Continue with Google
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key={`signup-${signupStep}`}
                variants={slideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-card border border-border p-8 sm:p-10 rounded-[2rem] shadow-2xl"
              >
                {/* Wizard Progress */}
                <div className="flex items-center gap-2 mb-8">
                  {["role", "method", "details", "profile", "otp"].map((step, idx) => {
                    const stepIdx = ["role", "method", "details", "profile", "otp"].indexOf(signupStep);
                    return (
                      <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${idx <= stepIdx ? 'bg-primary' : 'bg-secondary'}`} />
                    )
                  })}
                </div>

                {signupStep === "role" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Create an account</h2>
                      <p className="text-sm text-muted-foreground">Select your primary role to get started.</p>
                    </div>

                    <button onClick={() => { setRole("worker"); setSignupStep("method"); }} className="group flex w-full items-center gap-5 rounded-2xl border border-input bg-background p-5 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]">
                      <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Briefcase size={24} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-lg font-bold text-foreground">I'm a Worker</div>
                        <div className="text-xs text-muted-foreground mt-1">Find jobs & build reputation.</div>
                      </div>
                      <ArrowRight size={18} className="text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                    
                    <button onClick={() => { setRole("customer"); setSignupStep("method"); }} className="group flex w-full items-center gap-5 rounded-2xl border border-input bg-background p-5 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]">
                      <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <User size={24} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-lg font-bold text-foreground">I'm a Customer</div>
                        <div className="text-xs text-muted-foreground mt-1">Hire verified professionals.</div>
                      </div>
                      <ArrowRight size={18} className="text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </div>
                )}

                {signupStep === "method" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Join as {role}</h2>
                      <p className="text-sm text-muted-foreground">Choose your preferred signup method.</p>
                    </div>
                    
                    <button onClick={() => setSignupStep("details")} className="w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-bold shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.98]">
                      Continue with Phone Number
                    </button>

                    <div className="my-6 flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-border" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OR</span>
                      <div className="h-[1px] flex-1 bg-border" />
                    </div>

                    <button type="button" onClick={handleGoogleSignIn} disabled={loadingAction} className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-background hover:bg-accent py-3.5 text-sm font-semibold text-foreground transition-all active:scale-[0.98]">
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                      Continue with Google
                    </button>
                  </div>
                )}

                {signupStep === "details" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-black text-foreground mb-1 tracking-tight">Account Details</h2>
                      <p className="text-xs text-muted-foreground">Let's setup your secure credentials.</p>
                    </div>

                    <form onSubmit={handleSignupDetailsSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Full Name *</label>
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Username *</label>
                          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Phone *</label>
                          <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Email *</label>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Password *</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${passwordStrength < 40 ? 'bg-destructive' : passwordStrength < 70 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${passwordStrength}%` }} />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Confirm Password *</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full rounded-xl border bg-background px-4 py-3 text-sm focus:ring-2 outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:border-primary focus:ring-primary/20'}`} required />
                      </div>

                      <div className="flex items-start gap-3 mt-4">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-primary" />
                        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                          I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                        </label>
                      </div>

                      <button type="submit" disabled={!validateDetails()} className="w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-bold shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-4">
                        Continue to Profile
                      </button>
                    </form>
                  </div>
                )}

                {signupStep === "profile" && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h2 className="text-2xl font-black text-foreground mb-1 tracking-tight">Complete Profile</h2>
                        <p className="text-xs text-muted-foreground">Add details to stand out (Optional)</p>
                      </div>
                      <button type="button" onClick={(e) => handleSignupProfileSubmit(e)} className="text-xs font-bold text-primary hover:underline">Skip</button>
                    </div>

                    <form onSubmit={handleSignupProfileSubmit} className="space-y-4">
                      {/* Avatar Upload */}
                      <div className="flex items-center gap-5 p-4 rounded-2xl bg-secondary/30 border border-border">
                        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-background border-2 border-border flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                          ) : (
                            <User className="text-muted-foreground" size={24} />
                          )}
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <Camera size={18} />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </label>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">Profile Photo</p>
                          <p className="text-xs">JPG, PNG under 1MB</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Address/Location</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="City, State" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Date of Birth</label>
                          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Gender</label>
                          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                            <option value="">Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Organization / Institute</label>
                        <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Current workplace or school" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Bio</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="A short description about yourself..." />
                      </div>

                      <button type="submit" className="w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-bold shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                        Next Step <ArrowRight size={16} />
                      </button>
                    </form>
                  </div>
                )}

                {signupStep === "otp" && (
                  <div className="space-y-6 text-center py-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Verify Identity</h2>
                      <p className="text-sm text-muted-foreground">We sent a secure code to +91 {phone}</p>
                    </div>

                    <form onSubmit={handleSignupOtpSubmit} className="space-y-8 mt-8">
                      <div className="flex justify-center gap-4">
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
                            className="h-16 w-14 rounded-2xl border border-input bg-background text-center text-3xl font-black text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 shadow-sm"
                            autoFocus={i === 0}
                            required
                          />
                        ))}
                      </div>

                      {loginError && <p className="text-destructive text-sm font-semibold">{loginError}</p>}

                      <button type="submit" disabled={otp.length < 4 || loadingAction} className="w-full rounded-xl bg-primary text-primary-foreground py-4 text-base font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50">
                        {loadingAction ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Complete Registration"}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-sm font-medium">
            {authMode === "login" ? (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button onClick={() => { setAuthMode("signup"); setSignupStep("role"); }} className="font-bold text-foreground hover:text-primary transition-colors ml-1 underline decoration-border underline-offset-4">
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => { setAuthMode("login"); }} className="font-bold text-foreground hover:text-primary transition-colors ml-1 underline decoration-border underline-offset-4">
                  Log in here
                </button>
              </p>
            )}
          </div>
          
          {authMode === "signup" && signupStep !== "role" && (
            <div className="mt-6 flex justify-center">
              <button onClick={() => setSignupStep("role")} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft size={12} /> Back to Role Selection
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Add missing ArrowLeft for the back button
import { ArrowLeft } from "lucide-react";

export default LoginPage;
