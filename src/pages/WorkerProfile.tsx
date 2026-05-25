import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { MOCK_VERIFICATIONS, getAverageRating, MOCK_DASHBOARD_DATA } from "@/data/mockData";
import { calculateTrustScore } from "@/utils/trustEngine";
import { calculateIncomeStats, parseBudgetToAmount } from "@/utils/financial";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp, where } from "firebase/firestore";
import {
  MapPin, Wrench, Phone, Shield, Star, Briefcase, CalendarDays, ChevronRight, LogOut, Edit2, User, UserCheck, History as LucideHistory, Award, Mail, Globe, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { uploadProfileImage } from "@/utils/storage";

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const WorkerProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<any[]>([]);
  const isDemoWorker = !!user?.isDemo;

  const [verificationsList, setVerificationsList] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    if (isDemoWorker) {
      setVerifications(MOCK_VERIFICATIONS);
      return;
    }

    const vQuery = query(collection(db, "verifications"), where("workerId", "==", user.id), orderBy("timestamp", "desc"));
    const unsubscribeV = onSnapshot(vQuery, (snapshot) => {
      const vList = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date() };
        });
      setVerificationsList(vList);
    });

    const wrQuery = query(collection(db, "work_requests"), where("workerId", "==", user.id), where("status", "in", ["In Progress", "Accepted", "Completed"]));
    const unsubscribeWR = onSnapshot(wrQuery, (snapshot) => {
      const wrList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: "wr-" + doc.id, ...data,
          timestamp: data.completedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
          source: "work_request",
          amount: data.amount || (data.budget ? parseBudgetToAmount(data.budget) : 0),
        };
      });
      setCompletedJobs(wrList);
    });

    return () => { unsubscribeV(); unsubscribeWR(); };
  }, [user, isDemoWorker]);

  useEffect(() => {
    if (isDemoWorker) return;
    const merged = [...verificationsList];
    completedJobs.forEach(job => {
      if (!merged.find(v => v.id === job.id)) merged.push(job);
    });
    merged.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
    setVerifications(merged);
  }, [verificationsList, completedJobs, isDemoWorker]);

  const profileMetrics = useMemo(() => {
    if (isDemoWorker) return MOCK_DASHBOARD_DATA;
    if (!verifications || verifications.length === 0) {
      return {
        summary: { totalJobs: 0, activeMonths: 0, repeatCustomers: 0 },
        performance: { avgRating: 0 },
        financial: { totalEarnings: 0 },
        trust: { muktiScore: user?.muktiScore || 0 }
      };
    }
    const stats = calculateIncomeStats(verifications);
    const avgR = verifications.reduce((acc: number, v: any) => acc + (v.rating || 0), 0) / verifications.length;
    const score = calculateTrustScore(user, verifications);

    return {
      summary: { totalJobs: stats.totalJobs, activeMonths: stats.activeMonths, repeatCustomers: 0 },
      performance: { avgRating: Number(avgR.toFixed(1)) },
      financial: { totalEarnings: stats.totalEarnings },
      trust: { muktiScore: score }
    };
  }, [verifications, user, isDemoWorker]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    skill: user?.skill || "",
    location: user?.location || "",
    bio: user?.bio || "",
    organization: user?.organization || "",
  });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(user?.photo || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    navigate("/");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalPhotoUrl = user.photo;
      if (editPhotoFile) {
        finalPhotoUrl = await uploadProfileImage(user.id, editPhotoFile);
      }
      
      await updateUser({ 
        name: editData.name, 
        skill: editData.skill || undefined, 
        location: editData.location || undefined, 
        bio: editData.bio || undefined,
        organization: editData.organization || undefined,
        photo: finalPhotoUrl || undefined 
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const memberSince = user.lastActive ? new Date(user.lastActive).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "October 2025";

  return (
    <div className="container mx-auto max-w-7xl py-8 md:py-12 pb-24 relative overflow-hidden bg-background min-h-screen">
       {/* Background Premium Glows */}
       <div className="absolute top-[0%] right-[0%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[0%] left-[0%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

        <div className="mb-8 flex items-center justify-between relative z-10">
          <BackButton label="Dashboard" />
        </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 relative z-10">
        
        {/* Left Column: Avatar & Details */}
        <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex flex-col gap-6 md:col-span-12 lg:col-span-4">
          
          <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-premium p-8 rounded-3xl">
              <label htmlFor="edit-photo" className="group relative mb-8 flex h-32 w-32 mx-auto cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-secondary/50 transition-all hover:border-primary">
                {editPhotoPreview ? (
                  <img src={editPhotoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs font-semibold text-white">Upload</span>
                </div>
                <input id="edit-photo" type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditPhotoFile(file);
                      setEditPhotoPreview(URL.createObjectURL(file));
                    }
                }} />
              </label>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Full Name</label>
                  <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Headline / Skill</label>
                  <input value={editData.skill} onChange={e => setEditData({...editData, skill: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Location</label>
                  <input value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} rows={3} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-foreground text-background text-sm font-semibold shadow-lg hover:bg-foreground/90 transition-all">
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card-premium rounded-3xl p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-bl-full opacity-50" />
              
              <div className="relative mb-6 mx-auto w-32 h-32">
                 <div className="h-full w-full rounded-full bg-secondary flex items-center justify-center text-4xl font-bold text-muted-foreground shadow-lg overflow-hidden border-4 border-background">
                    {user.photo ? <img src={user.photo} alt="Profile" className="h-full w-full object-cover" /> : user.name.charAt(0)}
                 </div>
                 <div className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border shadow-sm">
                    <Award size={18} className="text-primary" />
                 </div>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              {user.skill && <p className="text-sm font-medium text-muted-foreground mt-1">{user.skill}</p>}
              
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                  <Shield size={14} /> Verified
                </div>
              </div>

              <p className="mt-6 text-sm text-muted-foreground/80 leading-relaxed text-left">
                {user.bio || "No biography provided yet. Edit your profile to add some details about yourself and your expertise."}
              </p>

              <button onClick={() => setIsEditing(true)} className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-all">
                <Edit2 size={16} /> Edit Profile
              </button>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Details List */}
          <motion.div variants={slideUp} className="card-premium rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-card/[0.02]">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact & Registry</h3>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <Mail size={18} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.email || "No email"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <Phone size={18} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <MapPin size={18} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.location || "Unknown Location"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <CalendarDays size={18} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Joined {memberSince}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Rating Summary & Actions */}
        <div className="flex flex-col gap-6 md:col-span-12 lg:col-span-8">
          
          {/* Animated Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div variants={slideUp} className="card-premium-glow rounded-3xl p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Star size={24} className="fill-primary drop-shadow-sm" />
              </div>
              <div className="text-3xl font-bold text-foreground">{profileMetrics.performance.avgRating}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">Rating</div>
            </motion.div>
            
            <motion.div variants={slideUp} className="card-premium-glow rounded-3xl p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                <Briefcase size={24} />
              </div>
              <div className="text-3xl font-bold text-foreground">{verifications.length}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">Jobs Completed</div>
            </motion.div>
            
            <motion.div variants={slideUp} className="card-premium-glow rounded-3xl p-6 text-center col-span-2 md:col-span-1">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                <Shield size={24} />
              </div>
              <div className="text-3xl font-bold text-foreground">
                {user.role === "worker" ? Math.round(profileMetrics.trust.muktiScore) : (user.trustScore || 0)}
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">Trust Score</div>
            </motion.div>
          </div>

          {/* Timeline / Experience */}
          <motion.div variants={slideUp} className="card-premium rounded-3xl p-6 sm:p-8 flex-1">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                 <Clock size={20} className="text-primary" /> Work History
               </h3>
             </div>

             {verifications.length === 0 ? (
               <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-secondary/30">
                 <LucideHistory size={40} className="mx-auto text-muted-foreground/50 mb-4" />
                 <p className="text-sm font-medium text-foreground">No work history yet.</p>
                 <p className="text-xs text-muted-foreground mt-1">Complete jobs to build your timeline.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {verifications.slice(0, 5).map((v, i) => (
                   <div key={v.id} className="relative pl-6 sm:pl-8 py-2">
                     <div className="absolute left-0 top-3 bottom-[-1rem] w-px bg-border last:bg-transparent" />
                     <div className="absolute left-[-4px] top-3 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                     <div className="bg-secondary/30 border border-border rounded-2xl p-4 sm:p-5 hover:border-primary/30 transition-all">
                       <div className="flex justify-between items-start gap-4 mb-2">
                         <h4 className="font-semibold text-sm sm:text-base text-foreground">{v.type || "Service Request"}</h4>
                         <span className="text-xs font-medium text-muted-foreground shrink-0">{new Date(v.timestamp).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{v.description || "Completed professional service."}</p>
                       {(v.rating || v.amount) && (
                         <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
                           {v.rating && <span className="flex items-center gap-1 text-primary"><Star size={14} className="fill-primary" /> {v.rating}.0</span>}
                           {v.amount && <span className="text-emerald-500">₹{v.amount}</span>}
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </motion.div>

          <motion.div variants={slideUp} className="grid grid-cols-2 gap-4">
             <button onClick={() => navigate("/report")} className="card-premium rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 group hover:bg-secondary">
               <Globe size={24} className="text-muted-foreground group-hover:text-foreground transition-colors" />
               <span className="text-sm font-semibold text-foreground">Export Resume</span>
             </button>
             <button onClick={handleLogout} className="card-premium rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 group hover:bg-destructive/10 hover:border-destructive/20">
               <LogOut size={24} className="text-muted-foreground group-hover:text-destructive transition-colors" />
               <span className="text-sm font-semibold text-destructive">Logout</span>
             </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
