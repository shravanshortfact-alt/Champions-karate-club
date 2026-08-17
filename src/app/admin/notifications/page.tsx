"use client";
import React, { useState, useEffect } from 'react';
import NotificationForm from '@/components/admin/NotificationForm';


export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      const data: any = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (data.success) {
        fetchNotifications();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting", error);
    }
  };

  return (
    <>
    <div className="animate-fade-in" style={{ padding: '1rem', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-primary" style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>Notifications</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + Send Notification
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', padding: '3rem', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No notifications sent yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>Title</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>Type & Priority</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>Recipients</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>Sent At</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => (
                <tr key={notif.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td data-label="Title" style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{notif.title}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.message}</div>
                  </td>
                  <td data-label="Type & Priority" style={{ padding: '1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: '#333', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', marginRight: '0.5rem', border: '1px solid var(--border-color)' }}>{notif.type}</span>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: notif.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.2)' : notif.priority === 'Important' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: notif.priority === 'Urgent' ? '#ef4444' : notif.priority === 'Important' ? '#f59e0b' : '#3b82f6', borderRadius: '4px', fontSize: '0.85rem', border: `1px solid ${notif.priority === 'Urgent' ? '#ef4444' : notif.priority === 'Important' ? '#f59e0b' : '#3b82f6'}` }}>{notif.priority}</span>
                  </td>
                  <td data-label="Recipients" style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {notif._count?.recipients || 0} Students
                  </td>
                  <td data-label="Sent At" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </td>
                  <td data-label="Actions" style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger-color, red)', color: 'var(--danger-color, red)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#18181b', border: '1px solid #3f3f46', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: '#3f3f46', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid #3f3f46', paddingBottom: '0.8rem', marginTop: 0 }}>Send Notification</h2>
            <NotificationForm onSuccess={() => { setIsModalOpen(false); fetchNotifications(); }} />
          </div>
        </div>
      )}
    </>
  );
}
