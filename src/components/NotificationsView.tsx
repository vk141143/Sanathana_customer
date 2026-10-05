import React, { useState, useEffect, useRef } from 'react';
import { NavTab } from '../types';
import { supabase } from '../lib/supabase';

interface NotificationsViewProps {
  onTabChange: (tab: NavTab) => void;
  userEmail?: string;
}

interface DBNotification {
  id: string;
  title: string;
  body: string;
  target_type: 'all' | 'individual';
  target_user_ids: string[];
  sent_at: string;
  created_at: string;
}

/* ── Icons ── */
const BellIcon = ({ size = 20, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
);

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

/* ── Unread Pulse Dot ── */
const PulseDot: React.FC = () => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setScale(s => (s === 1 ? 1.5 : 1)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: 'radial-gradient(circle, #F3D27A, #D4AF37)',
      boxShadow: '0 0 6px rgba(212,175,55,0.8)',
      transform: `scale(${scale})`,
      transition: 'transform 0.9s ease-in-out',
      flexShrink: 0,
    }} />
  );
};

/* ── Notification Popup ── */
const NotificationPopup: React.FC<{ item: DBNotification; onClose: () => void }> = ({ item, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: 430,
        maxHeight: '65vh',
        borderRadius: '20px 20px 0 0',
        background: 'linear-gradient(160deg, rgba(28,18,8,0.99), rgba(10,8,5,1))',
        border: '1px solid rgba(212,175,55,0.25)',
        borderBottom: 'none',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 32, height: 3, borderRadius: 2, background: 'rgba(212,175,55,0.35)' }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 10px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(10,8,5,1)',
          border: '1.5px solid rgba(212,175,55,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BellIcon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 16, fontWeight: 700, color: '#FFFFFF',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{item.title}</div>
          <div style={{ fontSize: 11, color: '#A0A0A0', marginTop: 1 }}>
            {new Date(item.sent_at).toLocaleString()} · {item.target_type === 'all' ? 'All Users' : 'Personal'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(212,175,55,0.15)', marginLeft: 16, marginRight: 16 }} />

      {/* Scrollable body */}
      <div style={{ overflowY: 'auto', padding: '14px 16px 28px', scrollbarWidth: 'none' }}>
        <p style={{ fontSize: 13, color: '#CCCCCC', lineHeight: '21px', margin: 0 }}>
          {item.body}
        </p>
      </div>
    </div>
  </div>
);

/* ── Notification Card ── */
const NotificationCard: React.FC<{ item: DBNotification; index: number; isNew: boolean; onOpen: () => void }> = ({ item, index, isNew, onOpen }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60 + index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const timeLabel = (() => {
    const diff = Date.now() - new Date(item.sent_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div
      onClick={onOpen}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        borderRadius: 14,
        padding: '10px 12px',
        background: isNew
          ? 'linear-gradient(135deg, rgba(40,28,10,0.95), rgba(15,10,5,0.98))'
          : 'linear-gradient(135deg, rgba(22,15,8,0.88), rgba(10,8,5,0.92))',
        border: isNew ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(212,175,55,0.1)',
        boxShadow: isNew ? '0 2px 12px rgba(212,175,55,0.08)' : '0 1px 6px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(10,8,5,1)',
        border: '1.5px solid rgba(212,175,55,0.35)',
        boxShadow: '0 0 8px rgba(212,175,55,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BellIcon size={18} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 14, fontWeight: 700, color: '#FFFFFF',
            flex: 1, marginRight: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.title}
          </span>
          <span style={{ fontSize: 10, color: '#B5B5B5', flexShrink: 0 }}>{timeLabel}</span>
        </div>
        <p style={{
          fontSize: 11, color: '#C0C0C0',
          lineHeight: '16px', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.body}
        </p>
      </div>

      {/* Unread dot for new notifications */}
      {isNew && (
        <div style={{ flexShrink: 0 }}>
          <PulseDot />
        </div>
      )}
    </div>
  );
};

/* ── Main View ── */
export const NotificationsView: React.FC<NotificationsViewProps> = ({ onTabChange, userEmail }) => {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [headerVisible, setHeaderVisible] = useState(false);
  const [bellGlow, setBellGlow] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState<DBNotification | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const bellRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Fetch supabase user uuid from firebase_uid (stored via email lookup)
  const fetchUserId = async () => {
    if (!userEmail) return null;
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    return data?.id ?? null;
  };

  const fetchNotifications = async (userId: string | null) => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (userId) {
      query = query.or(`target_type.eq.all,target_user_ids.cs.{"${userId}"}`);
    } else {
      query = query.eq('target_type', 'all');
    }

    const { data, error: err } = await query;
    if (err) {
      setError('Failed to load notifications.');
    } else {
      setNotifications(data as DBNotification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 50);
    bellRef.current = window.setInterval(() => setBellGlow(g => (g === 1 ? 1.3 : 1)), 1200);

    (async () => {
      const userId = await fetchUserId();
      userIdRef.current = userId;
      await fetchNotifications(userId);

      // Mark currently loaded as "seen" after first load
      // New ones arriving via realtime will be "new"
    })();

    return () => {
      clearTimeout(t1);
      if (bellRef.current) clearInterval(bellRef.current);
    };
  }, []);

  // Mark all current as seen once loaded
  useEffect(() => {
    if (!loading && notifications.length > 0 && seenIds.size === 0) {
      setSeenIds(new Set(notifications.map(n => n.id)));
    }
  }, [loading, notifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newRow = payload.new as DBNotification;
          const userId = userIdRef.current;
          const isForMe =
            newRow.target_type === 'all' ||
            (userId && newRow.target_user_ids?.includes(userId));
          if (isForMe) {
            setNotifications(prev => [newRow, ...prev]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090909',
      color: '#FFFFFF',
      paddingBottom: 100,
      maxWidth: 430,
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(212,175,55,0.06) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(212,175,55,0.04) 0%, transparent 50%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Header ── */}
        <div style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
            <button
              onClick={() => onTabChange('home')}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <BackIcon />
            </button>

            <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
              <h1 style={{
                fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
                fontSize: 22, fontWeight: 700, color: '#F7E6C1',
                margin: 0, lineHeight: 1.1,
              }}>
                Notifications
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: '4px 0 3px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.4)' }} />
                <span style={{ fontSize: 11, color: '#D4AF37' }}>✿</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.4)' }} />
              </div>
              <p style={{ fontSize: 11, color: '#B7B7B7', margin: 0 }}>
                Stay updated with your spiritual journey
              </p>
            </div>

            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,175,55,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 ${bellGlow * 14}px rgba(212,175,55,${bellGlow * 0.3})`,
              transition: 'box-shadow 1.2s ease',
            }}>
              <BellIcon />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ marginTop: 8 }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#D4AF37', padding: '60px 0', fontSize: 13 }}>
              Loading notifications...
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', color: '#E57373', padding: '40px 0', fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
              <p style={{ color: '#B8B8B8', fontSize: 13, margin: 0 }}>No notifications yet</p>
              <p style={{ color: '#666', fontSize: 11, marginTop: 6 }}>You'll see messages from your admin here</p>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map((item, i) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  index={i}
                  isNew={!seenIds.has(item.id)}
                  onOpen={() => setSelectedNotif(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Popup ── */}
      {selectedNotif && (
        <NotificationPopup item={selectedNotif} onClose={() => setSelectedNotif(null)} />
      )}
    </div>
  );
};
