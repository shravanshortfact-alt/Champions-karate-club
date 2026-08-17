"use client";

import { useState, useEffect } from 'react';

export const runtime = 'edge';


export default function AdminMessages() {
  const [defaultMessage, setDefaultMessage] = useState('Happy Birthday, {Student Name}! 🎉\nChampion Karate Club wishes you success, discipline, strength, and happiness. 🥋');
  const [logs, setLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings for birthday message
      const resSettings = await fetch('/api/settings');
      const data: any = await resSettings.json();
      if (data.birthdayMessage) {
        setDefaultMessage(data.birthdayMessage);
      }

      // Fetch message logs
      const resLogs = await fetch('/api/messages/logs');
      if (resLogs.ok) {
        setLogs(await resLogs.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthdayMessage: defaultMessage })
      });
      if (res.ok) {
        alert("Birthday message saved successfully.");
      } else {
        alert("Failed to save message.");
      }
    } catch (err) {
      alert("Error saving message.");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerBirthdayCheck = async () => {
    if (confirm("This will manually trigger the birthday check engine. Continue?")) {
      setIsTriggering(true);
      try {
        const res = await fetch('/api/cron/birthdays', { method: 'POST' });
        const data: any = await res.json();
        if (res.ok) {
          alert(`Successfully ran check. Messages sent: ${data.sentCount}`);
          fetchData(); // Refresh logs
        } else {
          alert("Error running birthday check.");
        }
      } catch (err) {
        alert("Failed to trigger check.");
      } finally {
        setIsTriggering(false);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-primary" style={{ margin: 0 }}>WhatsApp Messages</h1>
        <button 
          className="btn btn-primary" 
          onClick={triggerBirthdayCheck} 
          disabled={isTriggering}
        >
          {isTriggering ? 'Running...' : 'Run Birthday Check Now'}
        </button>
      </div>
      
      <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Automatic Birthday Wish</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            This message will be sent automatically to students on their birthday. Use <strong>{'{Student Name}'}</strong> to automatically insert the student's name.
          </p>
          <form onSubmit={handleSaveMessage}>
            <div className="form-group">
              <textarea 
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                rows={5}
                required
                style={{ width: '100%', padding: '0.8rem', background: '#111', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-outline" disabled={isSaving} style={{ width: '100%' }}>
              {isSaving ? 'Saving...' : 'Save Default Message'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Message History</h2>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Date & Time</th>
              <th style={{ padding: '1rem' }}>Student Name</th>
              <th style={{ padding: '1rem' }}>Recipient</th>
              <th style={{ padding: '1rem' }}>Message</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.student?.name}</td>
                <td style={{ padding: '1rem' }}>{log.recipient}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.message}</td>
                <td style={{ padding: '1rem', color: log.status === 'Sent' ? '#4ade80' : '#ef4444' }}>
                  {log.status}
                  {log.errorMessage && <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>({log.errorMessage})</div>}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No messages logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
