import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { QrCode, Clock, ArrowLeft, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const QR_EXPIRY_SECONDS = 300; // 5 minutes

const QRScreen = () => {
  const { user, updateUser, syncLocation } = useAuth();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [sessionId, setSessionId] = useState(() => Date.now().toString(36));
  const [verificationCode, setVerificationCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [isSyncing, setIsSyncing] = useState(true);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [qrCount, setQrCount] = useState(() => {
    const saved = localStorage.getItem(`qr_count_${user?.id}`);
    const today = new Date().toDateString();
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) return data.count;
    }
    return 1;
  });

  const MAX_QR_PER_DAY = 10; // Increased for better UX during demo

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(`qr_count_${user?.id}`, JSON.stringify({ date: today, count: qrCount }));
  }, [qrCount, user?.id]);

  useEffect(() => {
    const syncPulse = async () => {
      if (user && !isExpired && !user.isDemo) {
        setIsSyncing(true);
        setIsGpsLocked(false);
        try {
          // 1. Sync current GPS first for perfect handshake
          await syncLocation();
          setIsGpsLocked(true);
          
          // 2. Sync security pulse
          await updateUser({ 
            activeVerificationCode: verificationCode, 
            activeSessionId: sessionId 
          });
          
          // Small buffer to ensure Firestore propagation
          setTimeout(() => setIsSyncing(false), 500);
        } catch (e) {
          console.error("Perfect Pulse sync failed:", e);
          setIsSyncing(false);
        }
      } else if (user?.isDemo) {
        setIsSyncing(false);
        setIsGpsLocked(true);
      }
    };
    syncPulse();
  }, [sessionId, verificationCode, isExpired, user?.isDemo]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const resetQR = () => {
    if (qrCount >= MAX_QR_PER_DAY) return;
    setQrCount(prev => prev + 1);
    const newSessionId = Date.now().toString(36);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(newSessionId);
    setVerificationCode(newCode);
    setSecondsLeft(QR_EXPIRY_SECONDS);
    setIsExpired(false);
  };

  if (!user || user.role !== "worker") {
    navigate("/");
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / QR_EXPIRY_SECONDS;

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center py-6 md:py-12 pb-24 px-4 relative overflow-hidden">
       {/* Background Orbs */}
       <div className="absolute top-[10%] left-[-15%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

       <div className="mb-10 flex w-full items-center justify-between relative z-10">
          <button onClick={() => navigate("/dashboard")} className="p-3 rounded-2xl bg-card/5 border border-border text-muted-foreground hover:text-primary-foreground transition-all">
             <ArrowLeft size={24} />
          </button>
          <div className="text-center flex-1">
             <h2 className="text-2xl font-black italic tracking-tighter text-primary-foreground uppercase italic">Verification ID</h2>
             <div className="flex items-center justify-center gap-2 mt-1">
               <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.4em]">Handshake Protocol Active</p>
               {isGpsLocked && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success-foreground text-[8px] font-black uppercase tracking-widest animate-in fade-in zoom-in slide-in-from-right-1 duration-500">
                    <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
                    GPS Locked
                 </div>
               )}
             </div>
          </div>
       </div>

      <div className="w-full rounded-[3.5rem] bg-background p-10 text-center border border-border shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
        
        {/* QR visual */}
        <div className="relative mx-auto mb-10 flex h-72 w-72 items-center justify-center">
          {/* Timer ring */}
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke={isExpired ? "#ef4444" : "#f97316"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 301.6} 301.6`}
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* QR placeholder */}
          <div className={`flex h-64 w-64 items-center justify-center rounded-[2.5rem] border-2 border-dashed transition-all duration-500 ${isExpired ? "border-destructive/20 bg-destructive/5" : "border-primary/30 bg-primary/5 shadow-[inset_0_0_40px_rgba(249,115,22,0.05)]"}`}>
            {isExpired ? (
              <div className="flex flex-col items-center gap-3">
                 <AlertCircle size={40} className="text-destructive" />
                 <div className="text-[10px] font-black text-destructive uppercase tracking-widest italic">Signal Expired</div>
              </div>
            ) : isSyncing ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <RefreshCw size={32} className="text-primary animate-spin" />
                <div className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Syncing Handshake...</div>
              </div>
            ) : (
              <div className="bg-card p-5 rounded-[2rem] shadow-2xl shadow-primary-glow transform hover:scale-105 transition-transform duration-500">
                <QRCodeSVG 
                  value={`${window.location.origin}/verify/${user.id}/${sessionId}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}
          </div>
        </div>

        {!isExpired && (
          <div className="mb-10 animate-in zoom-in-95 duration-700">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em] mb-4">Transmission Code</div>
            <div className="flex items-center justify-center gap-2">
              {verificationCode.split("").map((char, i) => (
                <div key={i} className="h-14 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary shadow-inner uppercase tracking-tighter">
                  {char}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer & Status */}
        <div className="mb-10 flex flex-col items-center gap-2">
           <div className="flex items-center gap-3">
              <Clock size={20} className={isExpired ? "text-destructive" : "text-primary animate-pulse"} />
              <span className={`text-4xl font-black tabular-nums tracking-tighter italic ${isExpired ? "text-destructive" : "text-primary-foreground"}`}>
                {isExpired ? "00:00" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
              </span>
           </div>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-4 leading-relaxed max-w-[240px]">
             {isExpired
               ? "Identity pulse timeout. Please regenerate handshake token."
               : "Request customer to authenticate using this signature."
             }
           </p>
        </div>

        {isExpired ? (
          <div className="w-full space-y-4">
            <button
              onClick={resetQR}
              disabled={qrCount >= MAX_QR_PER_DAY}
              className="h-20 w-full rounded-3xl bg-primary text-primary-foreground font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
            >
              <RefreshCw size={24} />
              TOKEN REGEN
            </button>
            <p className="text-[9px] font-black text-foreground uppercase tracking-[0.3em] italic">
              {MAX_QR_PER_DAY - qrCount} Synchronizations Remaining
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-card/5 border border-border p-6 flex items-center justify-between text-left group-hover:border-primary/20 transition-all">
             <div>
                <div className="text-lg font-black text-primary-foreground italic tracking-tighter uppercase">{user.name}</div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{user.skill}</div>
             </div>
             <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary-glow">
                <ShieldCheck size={28} />
             </div>
          </div>
        )}
      </div>

      <div className="mt-10 rounded-[2rem] border border-dashed border-border p-6 text-center bg-card/[0.02] max-w-sm">
         <div className="flex items-center justify-center gap-3 mb-3">
            <AlertCircle size={14} className="text-primary" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Safety Protocol 4.0</span>
         </div>
         <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">System cycles tokens every 300s to prevent session hijacking. Keep this screen active during handshake.</p>
      </div>
    </div>
  );
};

export default QRScreen;
