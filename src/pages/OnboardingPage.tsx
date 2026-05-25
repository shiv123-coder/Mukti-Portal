import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, User, MapPin, Loader2, Target, DollarSign, Clock } from "lucide-react";
import { getCurrentPosition, reverseGeocode } from "@/utils/geoValidator";
import { toast } from "sonner";

const OnboardingPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [skill, setSkill] = useState("");
  const [experience, setExperience] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Prevent accessing if profile is already complete
  useEffect(() => {
    if (user?.isProfileComplete) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const pos = await getCurrentPosition();
      setCoords(pos);
      const city = await reverseGeocode(pos.lat, pos.lng);
      setLocation(city);
      toast.success(`Location detected: ${city}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Location detection failed. Please type it manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!skill || !experience || !rate || !location) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setLoading(true);
    try {
      // Auto-detect workerType: 0 = Fixed (Maid, Cook, Helper), 1 = Mobile (Plumber, Electrician, etc.)
      const fixedSkills = ["maid", "cook", "helper", "servant", "cleaner"];
      const isFixed = fixedSkills.some(s => skill.toLowerCase().includes(s));

      await updateUser({
        skill,
        experienceYears: Number(experience),
        hourlyRate: Number(rate),
        bio,
        location,
        location_coords: coords || undefined,
        workerType: isFixed ? 0 : 1,
        isProfileComplete: true
      });
      
      toast.success("Profile completed successfully!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
              Welcome to Mukti!
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">Let's build your professional profile to start getting jobs.</p>
          </div>

          <div className="bg-card/60 backdrop-blur-2xl border border-border p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
              <div 
                className="h-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><Briefcase size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold">What do you do?</h3>
                    <p className="text-xs text-muted-foreground">This helps us match you with the right opportunities.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Primary Skill</label>
                    <div className="relative group">
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        placeholder="e.g. Electrician, Plumber, Cleaner..."
                        className="w-full rounded-2xl border border-border bg-card/40 pl-11 pr-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Years of Experience</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value ? Number(e.target.value) : "")}
                        placeholder="e.g. 5"
                        className="w-full rounded-2xl border border-border bg-card/40 pl-11 pr-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!skill || experience === ""}
                  className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-foreground shadow-primary-glow transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 mt-6"
                >
                  Next Step
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary"><DollarSign size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold">Pricing & Bio</h3>
                    <p className="text-xs text-muted-foreground">Set your rates and tell customers about yourself.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">Hourly Rate (₹)</label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="number"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value ? Number(e.target.value) : "")}
                        placeholder="e.g. 300"
                        className="w-full rounded-2xl border border-border bg-card/40 pl-11 pr-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block flex justify-between">
                      <span>Short Bio</span>
                      <span className="text-muted-foreground normal-case font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="I am a professional electrician with 5 years of experience in residential wiring..."
                      className="w-full rounded-2xl border border-border bg-card/40 p-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 rounded-2xl bg-secondary py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={rate === ""}
                    className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-foreground shadow-primary-glow transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><MapPin size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold">Where are you?</h3>
                    <p className="text-xs text-muted-foreground">Customers will see your general city location.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">City / Area</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Pune, Maharashtra"
                        className="w-full rounded-2xl border border-border bg-card/40 pl-11 pr-32 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-secondary text-xs font-bold hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDetecting ? <Loader2 size={14} className="animate-spin" /> : "Auto Detect"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 rounded-2xl bg-secondary py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!location || loading}
                    className="flex-1 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-foreground shadow-primary-glow transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Complete Profile & Start"}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
