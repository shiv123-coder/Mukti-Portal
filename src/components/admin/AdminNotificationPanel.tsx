import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Trash2, X, ShieldAlert, User, ShieldCheck, Briefcase, 
  Settings, Activity, CheckCircle2, AlertTriangle, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type NotificationType = 'Auth' | 'Users' | 'Jobs' | 'Security' | 'Reports' | 'System';
export type NotificationPriority = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId?: string;
  userRole?: string;
  read: boolean;
  createdAt: any;
  metadata?: any;
}

const TABS: Array<{ id: string, label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'Auth', label: 'Auth' },
  { id: 'Users', label: 'Users' },
  { id: 'Jobs', label: 'Jobs' },
  { id: 'Security', label: 'Security' },
  { id: 'Reports', label: 'Reports' },
  { id: 'System', label: 'System' },
];

const getPriorityIcon = (priority: NotificationPriority) => {
  switch (priority) {
    case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
    case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
    case 'danger': return <AlertCircle size={16} className="text-red-500" />;
    case 'info':
    default: return <Info size={16} className="text-blue-500" />;
  }
};

const getTypeIcon = (type: NotificationType) => {
  switch (type) {
    case 'Auth': return <ShieldCheck size={16} />;
    case 'Users': return <User size={16} />;
    case 'Jobs': return <Briefcase size={16} />;
    case 'Security': return <ShieldAlert size={16} />;
    case 'Reports': return <Activity size={16} />;
    case 'System': return <Settings size={16} />;
    default: return <Bell size={16} />;
  }
};

interface AdminNotificationPanelProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const AdminNotificationPanel: React.FC<AdminNotificationPanelProps> = ({ onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationItem[];
      
      setNotifications(notifs);
      setLoading(false);
      
      const unreadCount = notifs.filter(n => !n.read).length;
      if (onUnreadCountChange) onUnreadCountChange(unreadCount);
    });

    return () => unsubscribe();
  }, [onUnreadCountChange]);

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'All' ? true : n.type === activeTab
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
      toast.success('Notifications cleared');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      updateDoc(doc(db, 'notifications', notification.id), { read: true }).catch(console.error);
    }
    
    // Smart routing based on type
    if (notification.type === 'Users' || notification.type === 'Auth') {
      if (notification.userRole === 'worker' && notification.userId) {
        navigate(`/admin/worker/${notification.userId}`);
      } else {
        navigate(`/admin/${notification.userRole}s`);
      }
    } else if (notification.type === 'Jobs') {
      navigate('/admin/jobs');
    } else {
      navigate('/admin/dashboard');
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute right-0 mt-4 w-[420px] max-h-[85vh] flex flex-col rounded-[2.5rem] bg-card/95 backdrop-blur-3xl border border-border/50 shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/50 bg-background/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-black text-foreground uppercase tracking-tight italic">Notifications</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{unreadCount} Unread</p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="p-2 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
              >
                <Check size={16} />
              </button>
            )}
            <button 
              onClick={handleClearAll}
              title="Clear all"
              className="p-2 rounded-xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary-glow' 
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative bg-card/30 min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Signals...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground/30 mb-6">
              <Bell size={32} />
            </div>
            <h4 className="text-sm font-black text-foreground italic uppercase tracking-tight">Zero Activity</h4>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold">No notifications found for this category.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(notif)}
                className={`relative p-4 mb-3 rounded-2xl border transition-all cursor-pointer group ${
                  notif.read 
                    ? 'bg-card border-border hover:border-primary/30' 
                    : 'bg-primary/5 border-primary/20 hover:border-primary/50 hover:bg-primary/10 shadow-sm'
                }`}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
                )}
                
                <div className="flex gap-4">
                  <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-inner ${
                    notif.read ? 'bg-secondary text-muted-foreground' : 'bg-primary/20 text-primary'
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(notif.priority)}
                      <h4 className={`text-sm font-black italic tracking-tight truncate uppercase ${
                        notif.read ? 'text-foreground/80' : 'text-foreground'
                      }`}>
                        {notif.title}
                      </h4>
                    </div>
                    <p className={`text-xs font-bold leading-relaxed mb-3 ${
                      notif.read ? 'text-muted-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {notif.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                          {notif.createdAt?.toDate 
                            ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
                            : 'Just now'}
                        </span>
                        {notif.userRole && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                            {notif.userRole}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-background/50 text-center">
        <button 
          onClick={() => {
            onClose();
            navigate('/admin/dashboard');
          }}
          className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 w-full"
        >
          View Dashboard <ExternalLink size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export default AdminNotificationPanel;
