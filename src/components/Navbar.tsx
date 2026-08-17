"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Navbar({ settings }: { settings: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Check login status and fetch notifications
  useEffect(() => {
    const checkAuthAndFetchNotifs = async () => {
      const name = localStorage.getItem('studentPortal_name');
      setStudentName(name);

      if (name) {
        try {
          const res = await fetch(`/api/student/notifications?studentName=${encodeURIComponent(name)}`);
          if (res.ok) {
            const data: any = await res.json();
            if (data.success) {
              setNotifications(data.notifications);
            }
          }
        } catch (err) {
          console.error("Error fetching notifications", err);
        }
      }
    };

    checkAuthAndFetchNotifs();
    const interval = setInterval(checkAuthAndFetchNotifs, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReadNotification = async (notifRecId: string, url?: string) => {
    try {
      await fetch('/api/student/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: notifRecId })
      });
      setNotifications(prev => 
        prev.map(n => n.id === notifRecId ? { ...n, isRead: true } : n)
      );
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <nav className="main-nav" style={{ position: 'relative', zIndex: 50 }}>
        <div className="nav-left mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          <svg viewBox="0 0 100 80" width="25" height="25" fill="white">
            <rect width="100" height="15" rx="8"></rect>
            <rect y="35" width="100" height="15" rx="8"></rect>
            <rect y="70" width="100" height="15" rx="8"></rect>
          </svg>
        </div>
        <div className="nav-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Academy Logo" className="nav-logo" />
          ) : (
            <h2 className="nav-title" style={{ margin: 0, fontSize: "2rem" }}>CHAMPIONS KARATE</h2>
          )}
        </div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'flex-end' }}>
          
          <Link href="/" className="premium-icon-btn" aria-label="Home" title="Home">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </Link>

          <Link href="/rankings" className="premium-icon-btn" aria-label="Leaderboard" title="Leaderboard">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </Link>
          
          <Link href="/student" className="premium-icon-btn" aria-label="Student Login" title="Student Dashboard">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>

          {studentName && (
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.5rem', color: 'white' }}
                aria-label="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', 
                    borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{ 
                  position: 'absolute', top: '100%', right: -20, width: '320px', background: 'white', 
                  borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #e5e7eb', 
                  overflow: 'hidden', marginTop: '0.5rem', zIndex: 100 
                }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', fontWeight: 'bold' }}>Notifications</h3>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{unreadCount} unread</span>
                  </div>
                  <div className="hide-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', margin: 0 }}>No notifications yet.</p>
                    ) : (
                      notifications.map(notifReq => (
                        <div 
                          key={notifReq.id} 
                          onClick={() => handleReadNotification(notifReq.id, notifReq.notification.actionUrl)}
                          style={{ 
                            padding: '1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                            background: notifReq.isRead ? 'white' : '#eff6ff',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: notifReq.isRead ? 'normal' : 'bold', color: '#111827' }}>{notifReq.notification.title}</span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                              {new Date(notifReq.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.4' }}>{notifReq.notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${isOpen ? "open" : ""}`} style={{ zIndex: 100 }}>
        <div className="drawer-close" onClick={() => setIsOpen(false)}>
          &times;
        </div>
        <div className="drawer-links">
          <Link href="/rankings" onClick={() => setIsOpen(false)}>Leaderboard</Link>
          <Link href="/student" onClick={() => setIsOpen(false)} style={{ color: "var(--primary)", fontWeight: "bold" }}>Student Dashboard</Link>
          <hr style={{ borderColor: "#333", margin: "1rem 0" }} />
          <Link href="/register/admission" onClick={() => setIsOpen(false)}>Admission</Link>
          <Link href="/register/belt-exam" onClick={() => setIsOpen(false)}>Belt Exam</Link>
          <Link href="/register/competition" onClick={() => setIsOpen(false)}>Competition</Link>
          <Link href="/register/seminar" onClick={() => setIsOpen(false)}>Seminar</Link>
          <Link href="/pay-fee" onClick={() => setIsOpen(false)}>Fee Payment</Link>
        </div>
      </div>
      
      {isOpen && <div className="drawer-overlay" onClick={() => setIsOpen(false)} style={{ zIndex: 90 }}></div>}
    </>
  );
}
