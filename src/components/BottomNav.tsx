import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, QrCode, FileText, UserCircle, History, PlusCircle, Wallet, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

const WORKER_NAV = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/qr", label: "QR Code", icon: QrCode },
  { path: "/report", label: "Report", icon: FileText },
  { path: "/profile", label: "Profile", icon: UserCircle },
];

const CUSTOMER_NAV = [
  { path: "/customer", label: "Home", icon: LayoutDashboard },
  { path: "/verify", label: "Scanner", icon: QrCode },
  { path: "/activity", label: "Registry", icon: History },
  { path: "/profile", label: "Identity", icon: UserCircle },
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  if (!user) return null;

  let isWorkerView = user.role === "worker";

  if (user.role === "both") {
    if (location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/qr") || location.pathname.startsWith("/report")) {
      isWorkerView = true;
    } else if (location.pathname.startsWith("/verify") || location.pathname.startsWith("/customer") || location.pathname.startsWith("/activity")) {
      isWorkerView = false;
    } else {
      const stored = localStorage.getItem("lastView");
      isWorkerView = stored === "worker";
    }
  }

  const navItems = isWorkerView ? WORKER_NAV : CUSTOMER_NAV;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 px-6 md:hidden pb-safe print:hidden">
      <nav className="mx-auto flex h-20 max-w-lg items-center justify-around rounded-[2.5rem] bg-card/80 border border-border px-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/verify" && location.pathname.startsWith("/verify") && !location.pathname.includes("request"));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 transition-all duration-500 ease-out active:scale-90",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-primary-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-2xl p-2.5 transition-all duration-500",
                isActive ? "bg-primary/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)] border border-primary/20" : "bg-transparent border border-transparent"
              )}>
                <item.icon size={24} strokeWidth={isActive ? 3 : 2} className={isActive ? "drop-shadow-primary-glow" : ""} />
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-primary shadow-primary-glow animate-in fade-in zoom-in duration-500" />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 transition-all duration-500 ease-out active:scale-90 text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center justify-center rounded-2xl p-2.5 transition-all duration-500 bg-transparent border border-transparent">
            {isDark ? <Sun size={24} strokeWidth={2} /> : <Moon size={24} strokeWidth={2} />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic opacity-100">
            Theme
          </span>
        </button>
      </nav>
    </div>
  );
};

export default BottomNav;
