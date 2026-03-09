import React, { useState, useEffect } from 'react';
import { Trophy, X, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Notifications() {
  const { role, userId } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);
  const [lastSeenId, setLastSeenId] = useState<number | null>(null);

  useEffect(() => {
    // Don't show for partners or admins
    if (role === 'partner' || role === 'admin') return;
    
    const fetchNotifications = async () => {
      const targetGroup = role === 'trainee' ? 'trainees' : 'team';
      try {
        const res = await fetch(`/api/notifications?target_group=${targetGroup}&limit=1&exclude_user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const latest = data[0];
            // Only show if it's a new notification we haven't closed in this session
            // Or just show it if it's recent (last 24h)
            const isRecent = new Date(latest.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
            
            if (isRecent && latest.id !== lastSeenId) {
              setNotifications(data);
              setVisible(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Poll every 10 seconds for faster updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [role, userId, lastSeenId]);

  const handleClose = () => {
    setVisible(false);
    if (notifications.length > 0) {
      setLastSeenId(notifications[0].id);
    }
  };

  if (!visible || notifications.length === 0) return null;

  const latest = notifications[0];
  const isPromotion = latest.type === 'promotion';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      <div className={`pointer-events-auto bg-gradient-to-r ${isPromotion ? 'from-indigo-50 to-purple-50 border-indigo-400 text-indigo-900' : 'from-amber-50 to-yellow-50 border-yellow-400 text-yellow-900'} border px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-5 fade-in duration-500`}>
        <div className={`bg-gradient-to-br ${isPromotion ? 'from-indigo-400 to-purple-500' : 'from-yellow-400 to-amber-500'} p-2 rounded-full text-white shadow-sm shrink-0`}>
          {isPromotion ? <GraduationCap className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm md:text-base">{latest.message}</p>
          <p className={`text-xs mt-1 opacity-80 ${isPromotion ? 'text-indigo-700' : 'text-yellow-700'}`}>
            {new Date(latest.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button 
          onClick={handleClose}
          className={`p-1 rounded-full transition-colors ${isPromotion ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100' : 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
