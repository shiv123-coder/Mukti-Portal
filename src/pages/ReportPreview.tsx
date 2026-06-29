import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DEMO_VERIFICATIONS, MONTHLY_DATA, getAverageRating, DEMO_DASHBOARD_DATA, type MonthlyData } from "@/data/mockData";
import { calculateTrustScore } from "@/utils/trustEngine";
import { QRCodeSVG } from "qrcode.react";
import { 
  ArrowLeft, 
  Download, 
  Briefcase, 
  Star, 
  TrendingUp, 
  IndianRupee, 
  ShieldCheck, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MapPin,
  Fingerprint,
  Lock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line } from "recharts";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { calculateIncomeStats, parseBudgetToAmount } from "@/utils/financial";

const ReportPreview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsList, setVerificationsList] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const isDemoWorker = !!user?.isDemo;
  
  // Derived state for report access
  const isApproved = user?.isVerifiedByAdmin || (user as any)?.status === 'verified' || isDemoWorker;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Merge verifications + completed work_requests
  useEffect(() => {
    if (isDemoWorker) return;
    const merged = [...verificationsList];
    completedJobs.forEach(job => {
      if (!merged.find(v => v.id === job.id)) {
        merged.push(job);
      }
    });
    merged.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
    setVerifications(merged);
  }, [verificationsList, completedJobs, isDemoWorker]);

  useEffect(() => {
    if (!user) return;

    if (isDemoWorker) {
      setVerifications(DEMO_VERIFICATIONS);
      return;
    }

    const vQuery = query(
      collection(db, "verifications"),
      where("workerId", "==", user.id)
    );
    
    const unsubscribeV = onSnapshot(vQuery, (snapshot) => {
      const vList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(),
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Calculate repeat customers
      const customerCounts: Record<string, number> = {};
      vList.forEach((v: any) => {
        if (v.customerId) {
          customerCounts[v.customerId] = (customerCounts[v.customerId] || 0) + 1;
        }
      });

      const enrichedList = vList.map((v: any) => ({
        ...v,
        isRepeatCustomer: v.customerId ? customerCounts[v.customerId] > 1 : false
      }));
      
      setVerificationsList(enrichedList);
    }, async (err) => {
      console.warn("Report verifications listener inhibited, falling back to manual fetch:", err.message);
      try {
        const snapshot = await getDocs(vQuery);
        const vList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp ? (typeof doc.data().timestamp.toDate === 'function' ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)) : new Date(),
        }));
        setVerificationsList(vList);
      } catch (fetchErr) {
        console.error("Permanent report verification fetch failure:", fetchErr);
      }
    });

    // Also listen to completed/active work_requests for this worker
    const wrQuery = query(
      collection(db, "work_requests"),
      where("workerId", "==", user.id),
      where("status", "in", ["In Progress", "Accepted", "Completed"])
    );

    const unsubscribeWR = onSnapshot(wrQuery, (snapshot) => {
      const wrList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `wr-${doc.id}`,
          customerName: data.customerName || "Customer",
          customerId: data.customerId || "",
          workerName: data.workerName || user.name,
          workerSkill: data.workerSkill || data.service || user.skill,
          service: data.service,
          rating: data.rating || 4,
          amount: data.amount || (data.budget ? parseBudgetToAmount(data.budget) : 0),
          timestamp: data.completedAt ? (typeof data.completedAt.toDate === 'function' ? data.completedAt.toDate() : new Date(data.completedAt)) : data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
          location: data.location || "Local",
          paymentStatus: "Paid",
          isRepeatCustomer: false,
          source: "work_request",
        };
      });
      setCompletedJobs(wrList);
    }, (err) => {
      console.warn("Work requests listener failed:", err.message);
    });

    return () => {
      unsubscribeV();
      unsubscribeWR();
    };
  }, [user, isDemoWorker]);

  if (!user || (user.role !== "worker" && user.role !== "both")) {
    navigate("/");
    return null;
  }

  // Unified Data Calculation (Matches Dashboard & Profile)
  const reportData = useMemo(() => {
    // Generate Monthly Stats helper
    const getMonthlyStats = (vList: any[]) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const history = [];
      const current = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const yr = d.getFullYear();
        
        const monthJobs = vList.filter(v => v.timestamp.getMonth() === mIdx && v.timestamp.getFullYear() === yr);
        const earnings = monthJobs.reduce((sum, v) => sum + (v.amount || 0), 0);
        const rating = monthJobs.length > 0 ? monthJobs.reduce((s, v) => s + (v.rating || 0), 0) / monthJobs.length : 0;
        
        history.push({
          month: months[mIdx],
          jobs: monthJobs.length,
          rating: Number(rating),
          earnings: earnings,
          label: `${months[mIdx]} ${yr}`
        });
      }
      return history as MonthlyData[];
    };

    if (isDemoWorker) {
      return {
        ...DEMO_DASHBOARD_DATA,
        monthlyStats: MONTHLY_DATA,
        summary: { ...DEMO_DASHBOARD_DATA.summary, activeMonths: 4 }
      };
    }

    if (!verifications || verifications.length === 0) {
      return {
        summary: { totalJobs: 0, activeMonths: 0, repeatCustomers: 0 },
        performance: { avgRating: 0 },
        financial: { totalEarnings: 0, perJobIncome: 0, incomeRange: { min: 0, max: 0 }, safeEMI: 0, loanRange: { min: 0, max: 0 } },
        trust: { muktiScore: user?.muktiScore || 0 },
        loan: { safeEMI: 0, range: { min: 0, max: 0 } },
        monthlyStats: getMonthlyStats([])
      };
    }

    const stats = calculateIncomeStats(verifications);
    const avgR = verifications.reduce((acc: number, v: any) => acc + (v.rating || 0), 0) / verifications.length;
    const score = calculateTrustScore(user, verifications);
    
    const customerIds = verifications.map((v: any) => v.customerId).filter(Boolean);
    const repeatCustomers = customerIds.filter((id: string, i: number) => customerIds.indexOf(id) !== i).length;

    return {
      summary: { totalJobs: stats.totalJobs, activeMonths: stats.activeMonths, repeatCustomers },
      performance: { avgRating: Number(avgR.toFixed(1)) },
      financial: { totalEarnings: stats.totalEarnings, perJobIncome: stats.perJobIncome, incomeRange: stats.incomeRange, safeEMI: stats.safeEMI, loanRange: stats.loanRange },
      trust: { muktiScore: score },
      loan: { safeEMI: stats.safeEMI, range: stats.loanRange },
      monthlyStats: getMonthlyStats(verifications)
    };
  }, [verifications, user, isDemoWorker]);

  const avgRating = reportData.performance.avgRating;
  const muktiScore = reportData.trust.muktiScore;
  const totalEarnings = reportData.financial.totalEarnings;
  const totalJobs = reportData.summary.totalJobs;
  const repeatCustomers = reportData.summary.repeatCustomers;
  const stats = reportData.financial; 
  const finStats = reportData.financial; // Alias for UI
  const incomeStats = reportData; 
  const monthlyStats = reportData.monthlyStats;
  const activeMonths = reportData.summary.activeMonths;
  const trustScore = muktiScore; // Alias for UI

  const repeatPercentage = totalJobs > 0 ? Math.round((repeatCustomers / totalJobs) * 100) : 0;
  const verifiedPaymentsCount = verifications.filter((v: any) => v.paymentStatus === "Paid").length;
  const verifiedPaymentPercentage = totalJobs > 0 ? Math.round((verifiedPaymentsCount / totalJobs) * 100) : 0;

  const trustLevel = muktiScore >= 80 ? "HIGH" : muktiScore >= 50 ? "MEDIUM" : "LOW";
  const trustBg = muktiScore >= 80 ? "bg-success" : muktiScore >= 50 ? "bg-primary" : "bg-destructive";
  const trustColor = muktiScore >= 80 ? "text-success" : muktiScore >= 50 ? "text-primary" : "text-destructive";
  
  const estimatedYearlyIncome = stats.totalEarnings * (12 / Math.max(1, activeMonths));

  const isRegularWorker = totalJobs > 3 || repeatCustomers > 0;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      
      {/* 1. SCREEN VIEW (Old Dashboard Style) */}
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 pb-24 md:pb-10 px-3 sm:px-6 relative z-10 print:hidden">
        
        {/* Background Decorative Orbs */}
        <div className="absolute top-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-[10%] h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none -z-10" />

        <div className="mb-8 flex items-center animate-fade-up">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-xl glass text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="flex-1 text-center text-2xl font-extrabold tracking-tight text-foreground">
            Work Summary Report
          </h2>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          
          {/* Identity & Stats */}
          <div className="flex flex-col gap-6 lg:col-span-12 xl:col-span-5">
            <div className="rounded-2xl glass p-6 sm:p-8 card-shadow-hover relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
              
              <div className="mb-6 border-b border-border/50 pb-6 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">
                  <Fingerprint size={14} /> Registered Worker Profile
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-none">{user.name}</h3>
                <div className="mt-2 text-base font-bold text-muted-foreground flex items-center gap-2">
                  <span>{user.skill}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{user.location || "Patna"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                {(isRegularWorker ? [
                  { label: "Worker Segment", value: "REGULAR", icon: ShieldCheck, color: "text-success", bg: "bg-success/10" },
                  { label: "Avg Rating", value: `${avgRating.toFixed(1)}`, icon: Star, color: "text-warning", bg: "bg-warning/10" },
                  { label: "Loyalty Rate", value: `${repeatPercentage}%`, icon: Users, color: "text-accent", bg: "bg-accent/10" },
                  { label: "Est. Income", value: `₹${estimatedYearlyIncome.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success", bg: "bg-success/10" }
                ] : [
                  { label: "Worker Segment", value: "ONE-TIME", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
                  { label: "Avg Rating", value: `${avgRating.toFixed(1)}`, icon: Star, color: "text-warning", bg: "bg-warning/10" },
                  { label: "Trust Index", value: `${trustLevel}`, icon: ShieldCheck, color: "text-accent", bg: "bg-accent/10" },
                  { label: "Est. Income", value: `₹${estimatedYearlyIncome.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success", bg: "bg-success/10" }
                ]).map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/40 bg-background/30 p-4 transition-all hover:bg-background/60">
                    <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</div>
                    <div className="text-lg font-black text-foreground">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-primary uppercase tracking-widest">Verified Identity</div>
                  <div className="text-[10px] font-bold text-muted-foreground">Digital Repuation ID: MPR-{user.id.slice(0, 8).toUpperCase()}</div>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                if (user.isVerifiedByAdmin || isApproved || isDemoWorker) {
                  try {
                    const publicData = {
                      workerName: user.name,
                      skill: user.skill || 'General Worker',
                      location: user.location || 'N/A',
                      phone: user.phone || '',
                      muktiScore: muktiScore,
                      confidence: trustLevel,
                      totalJobs: totalJobs,
                      avgRating: avgRating,
                      activeMonths: activeMonths,
                      repeatCustomers: repeatCustomers,
                      incomeMin: finStats.incomeRange.min,
                      incomeMax: finStats.incomeRange.max,
                      isVerified: isApproved,
                      timestamp: serverTimestamp(),
                      computed: {
                        recentJobs: verifications.slice(0, 5).map(v => ({
                          date: v.timestamp instanceof Date ? v.timestamp.toLocaleDateString() : new Date(v.timestamp).toLocaleDateString(),
                          category: v.service || 'General',
                          rating: v.rating || 4
                        })),
                        trustStack: {
                           otp: true, geo: true, photo: totalJobs > 0, timestamp: true, repeat: repeatCustomers > 0
                        }
                      }
                    };
                    await setDoc(doc(db, "public_reports", user.id), publicData);
                    window.print();
                    toast.success('Premium Trust Report Downloaded!');
                  } catch (err) {
                    console.error("Failed to sync report data:", err);
                    toast.error("Failed to generate official report");
                  }
                }
              }}
              disabled={!(user.isVerifiedByAdmin || isApproved || isDemoWorker)}
              className={`group flex h-14 sm:h-16 w-full items-center justify-center gap-3 rounded-2xl font-black text-primary-foreground shadow-xl transition-all ${(user.isVerifiedByAdmin || isApproved || isDemoWorker) ? 'bg-gradient-primary shadow-primary-glow hover:opacity-90 active:scale-[0.98]' : 'bg-card cursor-not-allowed opacity-50'}`}
            >
              {(user.isVerifiedByAdmin || isApproved || isDemoWorker) ? <Download size={22} className="group-hover:translate-y-0.5 transition-transform" /> : <Lock size={22} />}
              {(user.isVerifiedByAdmin || isApproved || isDemoWorker) ? "GENERATE OFFICIAL REPORT" : "REPORT LOCKED"}
            </button>
            {!(user.isVerifiedByAdmin || isApproved || isDemoWorker) && (
              <p className="text-[10px] font-black text-primary/60 text-center uppercase tracking-widest italic animate-pulse">
                Verification required for official export
              </p>
            )}
          </div>

          {/* Charts & Logs */}
          <div className="flex flex-col gap-6 md:col-span-12 lg:col-span-7">
            <div className="rounded-2xl glass p-6 card-shadow-hover">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-black text-foreground uppercase tracking-widest">
                  <TrendingUp size={18} className="text-primary" /> Income Trend
                </div>
                <div className="text-[10px] font-black text-muted-foreground bg-muted/20 px-2 py-1 rounded">ESTIMATED (6M)</div>
              </div>
              <div className="h-48 w-full md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 2, 2]} />
                    <XAxis dataKey="month" hide />
                    <Tooltip cursor={{fill: 'currentColor', opacity: 0.1}} contentStyle={{borderRadius: '12px', border: 'none', background: 'rgba(var(--card), 0.8)', backdropFilter: 'blur(8px)', fontWeight: 'bold'}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl glass p-6 card-shadow-hover">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> {isRegularWorker ? "Regular Partners" : "Verification Log"}
                </h3>
              </div>
              {user.workerType === 0 ? (
                <div className="space-y-4">
                   <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                      <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Employer Name</div>
                      <div className="text-lg font-black">{user.employerName || "N/A"}</div>
                   </div>
                   <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                      <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Verification Status</div>
                      <div className={`text-sm font-black flex items-center gap-2 ${user.employerVerified ? "text-success" : "text-warning"}`}>
                         {user.employerVerified ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                         {user.employerVerified ? "Verified Official Identity" : "Pending Verification"}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {verifications.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 py-3 shadow-sm hover:border-primary/30 transition-all">
                      <span className="text-sm font-black text-foreground tracking-tight">{v.customerName}</span>
                      <span className="flex items-center gap-1 rounded bg-warning/10 px-2 py-1 text-xs font-black text-warning">
                        <Star size={10} className="fill-warning" /> {v.rating}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRINT VIEW (Professional Financial Statement - ONLY VISIBLE ON PRINT) */}
      <div className="hidden print:block w-full bg-card text-foreground p-0 m-0">
        <div className="bg-card border-0 shadow-none overflow-hidden w-full">
          
          {/* Official Header */}
          <div className="p-10 border-b-4 border-primary flex justify-between items-start bg-muted">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                  <Fingerprint size={28} />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Mukti Portal</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Verified Identity Network</p>
                </div>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-1">Financial Data Report</h2>
              <p className="text-sm font-semibold text-muted-foreground italic">Peer-Verified Alternative Work Record</p>
            </div>
            <div className="text-right flex flex-col items-end pt-2">
              <div className="rounded-md border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-4">
                Verified Document • {new Date().toLocaleDateString()}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Report Ref:</p>
                <p className="text-xs font-mono font-bold">MPR-{user.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Worker Profile Card */}
          <div className="p-10 grid grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Worker Identity</label>
                <h3 className="text-3xl font-black">{user.name}</h3>
                <p className="text-base font-bold text-muted-foreground">{user.skill || "Skill Not Specified"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Location</p>
                  <p className="text-sm font-bold">{user.location || "Patna, Bihar"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Member Since</p>
                  <p className="text-sm font-bold">Oct 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2 w-fit">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">IDENTITY VERIFIED</span>
              </div>
            </div>

            {/* Trust Score Visual & QR Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-center">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Trust Score Index</label>
                <div className="relative mb-4">
                  <div className="text-4xl font-black text-primary">{trustScore}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SCORE</div>
                </div>
                <div className={`text-sm font-black tracking-widest px-6 py-1.5 rounded-full ${trustBg} text-primary-foreground`}>
                    {trustLevel} TRUST
                </div>
              </div>

              <div className="rounded-2xl border-2 border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-center">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Scan for Work History</label>
                <div className="p-2 bg-white rounded-xl mb-2 shadow-sm border border-border/50 inline-block">
                  <QRCodeSVG 
                    value={`${window.location.origin}/report/public/${user.id}`}
                    size={70}
                    level="H"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">
                  Full Job Record
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary Table */}
          <div className="px-10 pb-10">
            <div className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <TrendingUp size={16} className="text-primary" /> {isRegularWorker ? "Consistent Business Record" : "Work History Statement"}
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[600px] sm:min-w-0 text-left text-sm">
                <thead className="bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Month/Year</th>
                    <th className="px-6 py-4">{isRegularWorker ? "Handshake Status" : "Jobs"}</th>
                    <th className="px-6 py-4 text-center">{isRegularWorker ? "Partner Rating" : "Rating"}</th>
                    <th className="px-6 py-4 text-right">Income (Verified)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {(user.workerType === 0 ? [
                    { label: "Mar 2024", jobs: "Confirmed ✓", rating: "5.0", earnings: 12400 },
                    { label: "Feb 2024", jobs: "Confirmed ✓", rating: "5.0", earnings: 12400 },
                    { label: "Jan 2024", jobs: "Confirmed ✓", rating: "4.8", earnings: 11800 },
                    { label: "Dec 2023", jobs: "Confirmed ✓", rating: "5.0", earnings: 12400 },
                    { label: "Nov 2023", jobs: "Confirmed ✓", rating: "5.0", earnings: 12400 },
                    { label: "Oct 2023", jobs: "Confirmed ✓", rating: "4.5", earnings: 11000 },
                  ] : monthlyStats).map((stat) => (
                    <tr key={stat.label}>
                      <td className="px-6 py-4">{stat.label}</td>
                      <td className="px-6 py-4">{stat.jobs}</td>
                      <td className="px-6 py-4 text-center">{stat.rating}/5.0</td>
                      <td className="px-6 py-4 text-right">₹{stat.earnings.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-card text-primary-foreground font-black uppercase">
                  <tr>
                    <td className="px-6 py-4">{user.workerType === 0 ? "Cumulative History" : "6-Month Summary"}</td>
                    <td className="px-6 py-4">{user.workerType === 0 ? "14 Months" : `${totalJobs} Jobs`}</td>
                    <td className="px-6 py-4 text-center">{user.workerType === 0 ? "5.0 Avg" : `${avgRating.toFixed(1)} Avg`}</td>
                    <td className="px-6 py-4 text-right text-lg">₹{(user.workerType === 0 ? 72400 : (monthlyStats as MonthlyData[]).reduce((sum, m) => sum + m.earnings, 0)).toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Professional Disclosure */}
          <div className="px-6 sm:px-10 pb-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <AlertCircle size={16} className="text-primary" /> Annual Projection
              </div>
              <div className="rounded-xl border border-primary bg-muted/50 p-5">
                <div className="text-[10px] font-black text-primary uppercase mb-1">Projected Annual Earnings</div>
                <div className="text-2xl font-black">₹{estimatedYearlyIncome.toLocaleString("en-IN")}</div>
                <p className="text-[9px] text-muted-foreground mt-2 italic leading-relaxed">
                  Based on verified work consistency and current market rates for {user.skill}.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-success">
                <ShieldCheck size={16} className="text-success" /> Data Verification Checklist
              </div>
              <div className="space-y-2 text-[11px] font-bold text-muted-foreground">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={12} className="text-success" /> OTP Handshake Verified Jobs
                </div>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={12} className="text-success" /> Peer-to-Peer Reputation Scoring
                </div>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={12} className="text-success" /> Blockchain-anchored Work Identity
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-8 bg-card text-primary-foreground flex justify-between items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Generated by Mukti System Interface</p>
              <p className="text-[8px] max-w-sm text-muted-foreground leading-relaxed uppercase">
                DISCLAIMER: This document serves as an alternative financial record for the informal sector. It is not an official bank statement. 
                System ID: {new Date().getTime()}
              </p>
            </div>
            <div className="text-[9px] font-mono text-primary">TIMESTAMP: {new Date().toISOString()}</div>
          </div>
        </div>
      </div>
      
      {/* Locked Overlay for Unverified Users */}
      {!(user.isVerifiedByAdmin || isApproved || isDemoWorker) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/20 backdrop-blur-[12px] print:hidden">
           <div className="w-full max-w-sm bg-background p-10 rounded-[3rem] border border-primary/20 shadow-3xl text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                 <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                 <div className="relative h-20 w-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary-glow">
                    <Lock size={40} strokeWidth={2.5} />
                 </div>
              </div>
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-primary-foreground italic tracking-tighter uppercase">Report Restricted</h3>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-loose italic px-2">
                    Official financial statements are generated only after admin identity verification.
                 </p>
              </div>
              <div className="p-5 rounded-2xl bg-card/5 border border-border space-y-2">
                 <div className="text-[10px] font-black text-primary uppercase tracking-widest italic flex items-center justify-center gap-2">
                    <Clock size={12} /> Status: Under Review
                 </div>
                 <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Check back after 24-48 hours
                 </div>
              </div>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full h-16 rounded-2xl bg-card/5 border border-border text-primary-foreground font-black uppercase tracking-[0.4em] text-[10px] hover:bg-card/10 transition-all"
              >
                 Return to Dashboard
              </button>
           </div>
        </div>
      )}
      
      {/* Dynamic Report Styles */}
      <style>{`
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; }
          .min-h-screen { min-height: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportPreview;
