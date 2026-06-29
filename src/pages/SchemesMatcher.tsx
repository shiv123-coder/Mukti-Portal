import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { matchSchemes, GovScheme } from '@/utils/govSchemes';
import { ArrowLeft, ExternalLink, ShieldCheck, Banknote, GraduationCap, Heart, Landmark, ChevronRight } from 'lucide-react';

import { calculateIncomeStats } from '@/utils/financial';

const SchemesMatcher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [verifications, setVerifications] = useState<any[]>([]);
  const [muktiScore, setMuktiScore] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    if (!user) return;

    const vQuery = query(collection(db, 'verifications'), where('workerId', '==', user.id));
    const unsub = onSnapshot(vQuery, (snap) => {
      const vList = snap.docs.map(d => d.data());
      setVerifications(vList);

      const stats = calculateIncomeStats(vList);
      setMonthlyIncome(Math.round(stats.monthlyIncome));
    });

    setMuktiScore(user.muktiScore || 0);
    return () => unsub();
  }, [user]);

  if (!user || (user.role !== 'worker' && user.role !== 'both')) {
    navigate('/');
    return null;
  }

  const matched = matchSchemes(muktiScore, monthlyIncome, verifications.length, !!user.isVerifiedByAdmin);

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'loan': return <Banknote size={20} className="text-success" />;
      case 'insurance': return <Heart size={20} className="text-destructive" />;
      case 'skill': return <GraduationCap size={20} className="text-primary" />;
      case 'pension': return <Landmark size={20} className="text-purple-500" />;
      default: return <ShieldCheck size={20} className="text-primary" />;
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'loan': return 'border-success/20 bg-success/10';
      case 'insurance': return 'border-destructive/20 bg-destructive/5';
      case 'skill': return 'border-primary/20 bg-primary/5';
      case 'pension': return 'border-purple-500/20 bg-purple-500/5';
      default: return 'border-primary/20 bg-primary/5';
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-6 md:py-10 pb-24 px-4 relative overflow-hidden">
      <div className="absolute top-[5%] left-[-10%] h-[400px] w-[400px] rounded-full bg-success/10 blur-[120px] pointer-events-none" />
      
      <div className="mb-10 relative z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-foreground uppercase">
          Government Schemes
        </h1>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">
          Matched to your profile • Mukti Score: {muktiScore}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600/20 to-emerald-500/5 border border-success/20 p-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-success text-foreground shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground italic tracking-tighter">
              {matched.length} Schemes Available
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Based on your income & work history
            </div>
          </div>
        </div>
      </div>

      {/* Scheme Cards */}
      <div className="space-y-4 relative z-10">
        {matched.map(scheme => (
          <div key={scheme.id} className={`rounded-[2rem] border p-5 sm:p-6 md:p-8 transition-all hover:scale-[1.01] ${categoryColor(scheme.category)}`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-3xl mt-1">{scheme.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-black text-foreground italic tracking-tighter uppercase">
                      {scheme.name}
                    </h3>
                    <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-border text-muted-foreground">
                      {scheme.category}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
                    {scheme.description}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    {categoryIcon(scheme.category)}
                    <span className="text-sm font-black text-foreground italic tracking-tight">
                      {scheme.benefit}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-secondary border border-border text-[10px] font-black text-foreground uppercase tracking-widest hover:bg-secondary/80 transition-all w-full sm:w-auto mt-4 sm:mt-0"
              >
                Apply <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}

        {matched.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
            <Landmark size={48} className="mx-auto text-foreground mb-4 opacity-30" />
            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
              No schemes matched yet. Increase your Mukti Score to unlock more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemesMatcher;
