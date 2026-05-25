import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Briefcase, MapPin, Calendar } from "lucide-react";
import { ExportMenu, ExportColumn } from "@/components/ExportMenu";

const AdminJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "jobs"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportColumns: ExportColumn<any>[] = [
    { header: "Job Title", key: "title" },
    { header: "Location", key: "location" },
    { header: "Status", key: "status" },
    { header: "Compensation (₹)", key: "pay" },
    { header: "Date Created", key: (job) => job.createdAt ? new Date(job.createdAt.toMillis?.() || job.createdAt).toLocaleDateString() : 'Unknown Date' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase">Jobs</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Monitor all job postings and activity</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-card p-6 rounded-[2rem] border border-border items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
          />
        </div>
        <ExportMenu 
          data={filteredJobs} 
          columns={exportColumns} 
          filename="Mukti_Jobs_Export" 
          title="Mukti Portal - Jobs & Requests" 
          subtitle={`Total Jobs: ${filteredJobs.length}`}
        />
      </div>

      <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Job Info</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Location</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Compensation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading Jobs...</div>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No Jobs Found</div>
                  </td>
                </tr>
              ) : filteredJobs.map(job => (
                <tr key={job.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-500 overflow-hidden shadow-inner">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground">{job.title || "Untitled Job"}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} /> {job.createdAt ? new Date(job.createdAt.toMillis?.() || job.createdAt).toLocaleDateString() : 'Unknown Date'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <MapPin size={14} className="text-muted-foreground" /> {job.location || "Anywhere"}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${job.status === 'open' ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {job.status || 'open'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-sm font-black text-success">{job.pay ? `₹${job.pay}` : "TBD"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;
