import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Globe, 
  Menu, 
  X,
  TrendingUp,
  Wallet,
  ShieldCheck,
  BrainCircuit,
  Bell,
  Sun,
  Moon,
  Briefcase,
  Shield
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!user || user.role !== "admin") return;
    
    // Switch from backend polling to real-time Firestore listeners (Self-Healing)
    const qReqs = query(collection(db, "verification_requests"), where("status", "==", "pending"));
    const qUsers = query(collection(db, "users"), where("status", "==", "pending"));

    let reqsCount = 0;
    let usersCount = 0;
    const pendingUsersIds: string[] = [];

    const unsubReqs = onSnapshot(qReqs, (snap) => {
      reqsCount = snap.size;
      const ids = snap.docs.map(d => d.data().workerId);
      updateTotal(reqsCount, usersCount, ids);
    });

    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const docs = snap.docs;
      usersCount = docs.length;
      updateTotal(reqsCount, usersCount, []); // We'll deduplicate in the helper
    });

    const updateTotal = (r: number, u: number, activeWorkerIds: string[]) => {
      // Simple approximation: use the larger of the two or a merged count if we had all IDs
      // For the badge, we just want to ensure it's not zero if someone is pending
      setPendingRequests(Math.max(r, u)); 
    };

    return () => {
      unsubReqs();
      unsubUsers();
    };
  }, [user]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin/dashboard" },
    { icon: <Users size={20} />, label: "Customers", path: "/admin/customers" },
    { icon: <Users size={20} />, label: "Workers", path: "/admin/workers" },
    { icon: <Briefcase size={20} />, label: "Jobs", path: "/admin/jobs" },
    { icon: <AlertTriangle size={20} />, label: "Fraud Detection", path: "/admin/fraud" },
    { icon: <MessageSquare size={20} />, label: "Reviews", path: "/admin/reviews" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
    { icon: <Shield size={20} />, label: "Admin Management", path: "/admin/management" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Sidebar - Responsive: Hidden on mobile (overlay when open), fixed on desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full w-64 lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary-glow">
            <ShieldCheck className="text-primary-foreground" size={24} />
          </div>
          {isSidebarOpen && (
            <span className="font-black text-foreground tracking-tighter text-xl italic uppercase">MUKTI PORTAL</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group active:scale-95 ${
                location.pathname === item.path 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary-glow italic' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className={`${location.pathname === item.path ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'}`}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-border space-y-6">
          {/* Admin Profile - Downside */}
          {isSidebarOpen && (
            <div className="flex items-center gap-4 px-2">
              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center font-black text-primary-foreground shadow-lg italic shadow-primary-glow">
                {user?.name?.[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-foreground uppercase tracking-wider truncate italic">{user?.name}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Super Admin</span>
              </div>
            </div>
          )}

          {/* Language Selector removed */}

          <button 
            onClick={logout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all group active:scale-95 italic font-black"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm uppercase tracking-wider">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-[55] bg-background/60 backdrop-blur-sm lg:hidden transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Top Navbar */}
        <header className="h-16 sm:h-20 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground lg:hidden transition-all active:scale-95"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hidden lg:flex transition-all active:scale-95 shadow-sm"
            >
              <Menu size={20} />
            </button>
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                className="bg-secondary border border-border rounded-full pl-12 pr-6 py-2 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all w-48 sm:w-80 text-foreground font-bold italic shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell with Above Functionality */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-all group relative active:scale-95 ${showNotifications ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary text-muted-foreground border border-border hover:text-foreground hover:bg-secondary/80'}`}
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {pendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-primary-foreground text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background animate-pulse shadow-lg">
                    {pendingRequests}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 rounded-[2.5rem] bg-card border border-border shadow-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300 z-50 backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-foreground italic">Registry Protocol</h4>
                    <span className="text-[8px] font-black text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/10 uppercase">
                      {pendingRequests} Pending
                    </span>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {pendingRequests > 0 ? (
                      <div 
                        onClick={() => {
                          setShowNotifications(false);
                          (window as any).location.href = "/admin/requests";
                        }}
                        className="flex gap-4 p-4 rounded-2xl bg-secondary border border-border transition-all hover:border-primary/20 group cursor-pointer"
                      >
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary h-fit group-hover:scale-110 transition-transform">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-foreground italic truncate uppercase tracking-tighter">Verification Needed</div>
                          <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase leading-relaxed opacity-70">
                            {pendingRequests} workers awaiting registry approval.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-secondary/20 rounded-3xl border border-dashed border-border">
                        <Bell size={32} className="mx-auto text-muted-foreground mb-4 opacity-30" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] italic">No active system signals</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6 border-t border-border pt-4">
                    <button 
                      onClick={() => setPendingRequests(0)}
                      className="flex-1 py-3 text-[9px] font-black uppercase text-muted-foreground hover:text-foreground transition-all tracking-[0.2em] bg-secondary/50 rounded-xl"
                    >
                      Mark Read
                    </button>
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        (window as any).location.href = "/admin/requests";
                      }}
                      className="flex-1 py-3 text-[9px] font-black uppercase text-primary-foreground bg-primary hover:bg-primary/90 transition-all tracking-[0.2em] rounded-xl shadow-md"
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative h-10 w-20 rounded-full bg-secondary border border-border p-1 transition-colors hover:border-primary/50 shadow-inner overflow-hidden flex items-center"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <div className={`absolute top-1 bottom-1 w-8 rounded-full bg-background shadow-md transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'left-10 bg-primary/20 text-primary' : 'left-1 text-foreground'}`}>
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                </div>
                <div className="flex w-full justify-between px-2 text-muted-foreground/50 pointer-events-none">
                  <Sun size={14} />
                  <Moon size={14} />
                </div>
              </button>

              <button
                onClick={logout}
                className="hidden sm:flex h-9 px-4 items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 transition-all hover:bg-red-500 hover:text-primary-foreground active:scale-95 text-[10px] font-black uppercase tracking-widest"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
