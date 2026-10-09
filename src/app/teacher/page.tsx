"use client";

import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Dashboard state
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ awaitingCount: 0, confirmedCount: 0, unverifiedCount: 0, totalCollectedAmount: 0 });
  const [loadingData, setLoadingData] = useState(false);

  // Modal / Confirm state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Check existing session if logged in
    const storedTeacher = localStorage.getItem('teacher_profile');
    if (storedTeacher) {
      try {
        const parsed = JSON.parse(storedTeacher);
        setTeacher(parsed);
        setIsLoggedIn(true);
        fetchTeacherData(parsed.id);
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);

    try {
      const res = await fetch('/api/teacher/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTeacher(data.teacher);
        localStorage.setItem('teacher_profile', JSON.stringify(data.teacher));
        setIsLoggedIn(true);
        fetchTeacherData(data.teacher.id);
      } else {
        setLoginError(data.error || 'Invalid login credentials.');
      }
    } catch (e) {
      setLoginError('Login failed. Please check your connection.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_profile');
    setIsLoggedIn(false);
    setTeacher(null);
  };

  const fetchTeacherData = async (teacherId: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/teacher/payments?teacherId=${teacherId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPayments(data.feePayments || []);
        setStats(data.stats || {});
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleConfirmAction = async (paymentId: string, action: 'CONFIRM' | 'REJECT') => {
    if (!teacher) return;
    setActionLoading(paymentId);

    try {
      const res = await fetch('/api/teacher/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          teacherId: teacher.id
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message);
        fetchTeacherData(teacher.id);
      } else {
        alert(data.error || `Failed to ${action.toLowerCase()} payment.`);
      }
    } catch (e) {
      alert("An error occurred during verification.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', minHeight: '80vh', maxWidth: '450px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.5rem', borderRadius: '16px', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(30,30,30,0.9) 100%)', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="text-primary" style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>Teacher Portal</h1>
            <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>Login to verify student UPI fee payments for your branches</p>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>Teacher Username</label>
              <input
                type="text"
                placeholder="e.g. aman"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loadingLogin} style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 'bold' }}>
              {loadingLogin ? 'Logging in...' : 'Login to Teacher Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const awaitingPayments = payments.filter(p => p.status === 'AWAITING_CONFIRMATION' || p.status === 'Pending');
  const confirmedPayments = payments.filter(p => p.status === 'PAID' || p.status === 'Verified');
  const rejectedPayments = payments.filter(p => p.status === 'PAYMENT_NOT_VERIFIED');

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.5rem', maxWidth: '950px', margin: '0 auto', minHeight: '85vh' }}>
      
      {/* Teacher Profile Header */}
      <div className="card" style={{ padding: '1.75rem', borderRadius: '16px', marginBottom: '2rem', background: '#111827', border: '1px solid #374151', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Teacher Dashboard</span>
          <h1 style={{ color: 'white', margin: '0.2rem 0', fontSize: '1.8rem' }}>Welcome, {teacher.name}!</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
            <span>💳 Direct UPI: <strong style={{ color: '#60a5fa' }}>{teacher.upiId || 'Not Configured'}</strong></span>
            <span>📍 Branches: <strong style={{ color: '#4ade80' }}>{teacher.branches?.join(', ') || 'None'}</strong></span>
          </div>
        </div>

        <button className="btn btn-outline" onClick={handleLogout} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
          🔒 Logout
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24' }}>
          <span style={{ fontSize: '0.8rem', color: '#fbbf24', textTransform: 'uppercase' }}>Awaiting Confirmation</span>
          <h2 style={{ color: '#fbbf24', margin: '0.3rem 0 0 0', fontSize: '2rem' }}>{stats.awaitingCount || 0}</h2>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80' }}>
          <span style={{ fontSize: '0.8rem', color: '#4ade80', textTransform: 'uppercase' }}>Confirmed Paid</span>
          <h2 style={{ color: '#4ade80', margin: '0.3rem 0 0 0', fontSize: '2rem' }}>{stats.confirmedCount || 0}</h2>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid #60a5fa' }}>
          <span style={{ fontSize: '0.8rem', color: '#60a5fa', textTransform: 'uppercase' }}>Total Collected Amount</span>
          <h2 style={{ color: '#60a5fa', margin: '0.3rem 0 0 0', fontSize: '1.8rem' }}>₹{stats.totalCollectedAmount || 0}</h2>
        </div>
      </div>

      {/* SECTION 1: Pending Confirmations (Action Needed) */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>Pending Payment Confirmations</h2>
          <span style={{ background: '#fbbf24', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {awaitingPayments.length} Action Needed
          </span>
        </div>

        {loadingData ? (
          <div style={{ color: '#94a3b8' }}>Refreshing payments...</div>
        ) : awaitingPayments.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', borderRadius: '12px', border: '1px solid #334155' }}>
            🎉 No pending payment confirmations! All student payments are verified.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {awaitingPayments.map((p) => (
              <div key={p.id} className="card" style={{ padding: '1.5rem', borderRadius: '14px', background: '#1e293b', border: '2px solid #fbbf24', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>{p.student?.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Branch: <strong style={{ color: 'white' }}>{p.student?.branch?.name || p.branch?.name}</strong> • Reg: {p.student?.registrationNumber}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 'bold' }}>AWAITING CONFIRMATION</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#4ade80' }}>₹{p.totalAmount}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem', background: '#0f172a', padding: '1rem', borderRadius: '10px' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Fee Month:</strong><br /><span style={{ color: 'white' }}>{p.month} {p.year}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Base Fee:</strong><br /><span style={{ color: 'white' }}>₹{p.baseAmount}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Late Fee:</strong><br /><span style={{ color: p.lateFee > 0 ? '#ef4444' : '#4ade80' }}>₹{p.lateFee}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>UPI Ref:</strong><br /><span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>{p.paymentReference || 'N/A'}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>UTR Submitted:</strong><br /><span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{p.utr || 'Not Entered'}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Submitted At:</strong><br /><span style={{ color: 'white', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleString()}</span></div>
                </div>

                {/* Teacher Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleConfirmAction(p.id, 'REJECT')}
                    disabled={actionLoading === p.id}
                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.7rem 1.2rem', fontWeight: 'bold' }}
                  >
                    {actionLoading === p.id ? 'Processing...' : '✕ PAYMENT NOT RECEIVED'}
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => handleConfirmAction(p.id, 'CONFIRM')}
                    disabled={actionLoading === p.id}
                    style={{ background: '#22c55e', borderColor: '#22c55e', padding: '0.7rem 1.5rem', fontWeight: 'bold' }}
                  >
                    {actionLoading === p.id ? 'Confirming...' : '✓ CONFIRM PAYMENT RECEIVED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Verified Paid Payments History */}
      <div>
        <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.4rem' }}>Confirmed Paid History</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#111827', color: '#94a3b8', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.9rem' }}>Student Details</th>
                <th style={{ padding: '0.9rem' }}>Month/Year</th>
                <th style={{ padding: '0.9rem' }}>Amount</th>
                <th style={{ padding: '0.9rem' }}>UPI Ref / UTR</th>
                <th style={{ padding: '0.9rem' }}>Confirmed At</th>
                <th style={{ padding: '0.9rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {confirmedPayments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.9rem' }}>
                    <strong style={{ color: 'white' }}>{p.student?.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.student?.branch?.name}</div>
                  </td>
                  <td style={{ padding: '0.9rem', color: 'white', fontWeight: 'bold' }}>{p.month} {p.year}</td>
                  <td style={{ padding: '0.9rem', color: '#4ade80', fontWeight: 'bold' }}>₹{p.totalAmount}</td>
                  <td style={{ padding: '0.9rem', fontSize: '0.85rem', color: '#60a5fa' }}>
                    Ref: {p.paymentReference || '-'}<br />
                    {p.utr && <span style={{ color: '#d97706' }}>UTR: {p.utr}</span>}
                  </td>
                  <td style={{ padding: '0.9rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.9rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
                      ✓ Paid
                    </span>
                  </td>
                </tr>
              ))}

              {confirmedPayments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No confirmed payments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
