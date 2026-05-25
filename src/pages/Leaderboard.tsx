import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ShieldCheck, Star, Trophy, Medal, Crown, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardWorker {
  id: string;
  name: string;
  skill: string;
  muktiScore: number;
  isVerifiedByAdmin: boolean;
  photo?: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<LeaderboardWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'worker')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardWorker))
        .filter(w => (w.muktiScore || 0) > 0)
        .sort((a, b) => (b.muktiScore || 0) - (a.muktiScore || 0))
        .slice(0, 50);
      setWorkers(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown size={24} className="text-warning drop-shadow-primary-glow" />;
    if (rank === 1) return <Medal size={22} className="text-muted drop-shadow-primary-glow" />;
    if (rank === 2) return <Medal size={20} className="text-primary drop-shadow-primary-glow" />;
    return <span className="text-sm font-black text-muted-foreground w-6 text-center">{rank + 1}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 0) return 'border-warning/30 bg-warning/5 shadow-primary-glow';
    if (rank === 1) return 'border-border/20 bg-slate-400/5';
    if (rank === 2) return 'border-primary/20 bg-primary/5';
    return 'border-border bg-card/[0.02]';
  };

  return (
    <div className="container mx-auto max-w-5xl py-6 md:py-10 pb-24 px-4 relative overflow-hidden">
      <div className="absolute top-[5%] left-[-10%] h-[400px] w-[400px] rounded-full bg-warning/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="mb-10 relative z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary-foreground text-[10px] font-black uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-primary text-primary-foreground shadow-xl shadow-primary-glow">
            <Trophy size={28} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-primary-foreground uppercase">Leaderboard</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Top Verified Workers by Mukti Score</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading Registry...</div>
          </div>
        ) : workers.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
            <Trophy size={48} className="mx-auto text-foreground mb-4 opacity-30" />
            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">No scored workers yet</p>
          </div>
        ) : workers.map((worker, rank) => (
          <div
            key={worker.id}
            className={`flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-[2rem] border transition-all hover:scale-[1.01] ${getRankBg(rank)}`}
          >
            <div className="flex items-center gap-5">
              <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-border flex items-center justify-center font-black text-muted-foreground text-lg">
                {worker.photo ? <img src={worker.photo} className="h-full w-full rounded-2xl object-cover" /> : worker.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-primary-foreground italic tracking-tighter uppercase">{worker.name}</div>
                  {worker.isVerifiedByAdmin && <ShieldCheck size={14} className="text-success" />}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{worker.skill || 'General'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl font-black text-lg italic tracking-tighter ${
                (worker.muktiScore || 0) >= 80 ? 'text-success bg-success/10' :
                (worker.muktiScore || 0) >= 50 ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'
              }`}>
                {Math.round(worker.muktiScore || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
