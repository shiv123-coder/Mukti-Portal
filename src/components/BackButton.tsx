import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
  className?: string;
}

export function BackButton({ label = "Back", fallbackPath = "/dashboard", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleBack}
      className={`group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm ${className}`}
      aria-label="Go back"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-sm group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <ArrowLeft size={16} strokeWidth={2.5} />
      </div>
      <span className="tracking-tight">{label}</span>
    </motion.button>
  );
}
