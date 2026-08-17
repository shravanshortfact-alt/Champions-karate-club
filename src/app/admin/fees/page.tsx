"use client";

import { useState, useEffect } from 'react';

export default function AdminFees() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/fee');
      const data: any = await res.json();
      if (Array.isArray(data)) {
        setPayments(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch('/api/fee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Verified' })
      });
      const data: any = await res.json();
      if (data.success) {
        setPayments(payments.map(p => p.id === id ? { ...p, status: 'Verified' } : p));
      } else {
        alert("Failed to verify payment");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading fees...</div>;

  const exportToGoogleSheet = () => {
    const headers = ['Date', 'Student Name', 'Branch', 'Month/Year', 'Amount', 'Late Fee', 'UTR Number', 'Status'];
    
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.student?.name || '-',
      p.student?.branch?.name || '-',
      `${p.month} ${p.year}`,
      p.totalAmount,
      p.lateFee,
      p.transactionId || '-',
      p.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Fee Payments</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={exportToGoogleSheet}>Export to Google Sheet</button>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Month/Year</th>
              <th style={{ padding: '1rem' }}>Amount</th>
              <th style={{ padding: '1rem' }}>UTR / Proof</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="Date" style={{ padding: '1rem' }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td data-label="Student" style={{ padding: '1rem' }}>
                  <strong>{payment.student?.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{payment.student?.branch?.name}</span>
                </td>
                <td data-label="Month/Year" style={{ padding: '1rem' }}>{payment.month} {payment.year}</td>
                <td data-label="Amount" style={{ padding: '1rem' }}>
                  ₹{payment.totalAmount}
                  {payment.lateFee > 0 && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(+₹{payment.lateFee} Late)</span>}
                </td>
                <td data-label="UTR / Proof" style={{ padding: '1rem' }}>
                  {payment.transactionId && <div style={{ fontSize: '0.85rem' }}>UTR: {payment.transactionId}</div>}
                  {payment.screenshotUrl && (
                    <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>View Screenshot</a>
                  )}
                </td>
                <td data-label="Status" style={{ padding: '1rem', color: payment.status === 'Verified' ? '#4ade80' : '#fbbf24' }}>
                  {payment.status}
                </td>
                <td data-label="Action" style={{ padding: '1rem' }}>
                  {payment.status === 'Pending' ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleVerify(payment.id)}
                    >
                      Verify
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Verified</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No fee payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
