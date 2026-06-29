import { Sun, Moon, LogOut, LayoutDashboard, QrCode, FileText, UserCircle, Languages, WifiOff, Bell, ShieldCheck, UserCheck, History, PlusCircle, Trophy, Globe } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

const WORKER_NAV = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/qr", label: "QR Code", icon: QrCode },
  { path: "/report", label: "Report", icon: FileText },
  { path: "/profile", label: "Profile", icon: UserCircle },
];

const CUSTOMER_NAV = [
  { path: "/verify", label: "Home", icon: LayoutDashboard },
  { path: "/activity", label: "Activity", icon: History },
  { path: "/profile", label: "Profile", icon: UserCircle },
];

const AppHeader = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  // Notifications are now handled by NotificationPanel component
  const navItems = user?.role === "worker" ? WORKER_NAV : CUSTOMER_NAV;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border print:hidden">
      <div className="relative container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        
        {/* Left: Logo */}
        <Link 
          to={user ? (user.role === 'customer' ? "/verify" : "/dashboard") : "/"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-95 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-lg shadow-primary-glow">
            <span className="text-xl font-black italic">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black italic leading-none text-foreground tracking-tighter uppercase">Mukti</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary leading-none mt-1 pl-0.5">Portal</span>
          </div>
          {!isOnline && (
            <div className="ml-3 flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[8px] font-black text-red-500 border border-red-500/20 animate-pulse uppercase tracking-widest">
              <WifiOff size={10} />
              Offline
            </div>
          )}
        </Link>
        
        {/* Center: Desktop Navigation */}
        {user && (
          <nav className={cn(
            "hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-2xl border p-1.5 backdrop-blur-2xl transition-all",
            isDark ? "bg-card/40 border-border" : "bg-card/90 border-border shadow-xl shadow-black/5"
          )}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === "/verify" && location.pathname.startsWith("/verify") && !location.pathname.includes("request"));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary-glow italic" 
                      : isDark 
                        ? "text-muted-foreground hover:text-primary-foreground hover:bg-card/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon size={16} strokeWidth={isActive ? 3 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-4 font-black">
          {user && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-foreground italic tracking-tight">{user.name}</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 opacity-70">{user.role}</span>
              </div>
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-primary/30 bg-secondary shadow-lg shadow-primary-glow">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-black text-sm italic uppercase">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="h-6 w-px bg-card/5 hidden sm:block mx-1"></div>
          
          {/* Language selector removed */}
          
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/80 active:scale-95"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user && (
            <NotificationPanel userId={user.id} role={user.role} />
          )}

          {user && (
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 transition-all hover:bg-red-500 hover:text-primary-foreground active:scale-95 shadow-lg shadow-red-500/5 group"
              aria-label="Logout"
            >
              <LogOut size={18} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
