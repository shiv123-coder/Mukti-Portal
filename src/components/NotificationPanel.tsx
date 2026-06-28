import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Circle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: any;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export const NotificationPanel = ({ userId, role }: { userId: string, role: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (err) => {
      console.warn("Notifications listener error:", err.message);
    });
    return () => unsub();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary/50 transition-colors"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] flex flex-col rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/20">
            <h3 className="font-black uppercase tracking-widest text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] uppercase font-bold text-primary hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-bold">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex gap-3 p-3 rounded-xl mb-1 cursor-pointer transition-colors ${n.read ? 'opacity-70 hover:bg-secondary/30' : 'bg-primary/5 hover:bg-primary/10'}`}
                >
                  <div className="mt-1">
                    {!n.read ? <Circle size={10} className="text-primary fill-primary" /> : <Check size={10} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-2 block">
                      {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
