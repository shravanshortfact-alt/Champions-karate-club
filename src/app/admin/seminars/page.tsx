"use client";

import { useState, useEffect } from 'react';




export default function AdminSeminars() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [seminars, setSeminars] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: any) => {
        const uniqueBranches = new Set<string>();
        if (data.registrationLinks) {
          data.registrationLinks.forEach((link: any) => {
            if (link.branches) {
              link.branches.forEach((b: any) => uniqueBranches.add(b.name));
            }
          });
        }
        setBranches(Array.from(uniqueBranches).map(name => ({ name })));
      });

    fetch('/api/registrations')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setSeminars(data.filter(r => r.category === 'Seminar'));
        }
      });
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'PATCH' });
      const data: any = await res.json();
      if (data.success) {
        setSeminars(seminars.map(s => s.id === id ? { ...s, status: 'Verified' } : s));
      } else {
        alert("Failed to verify registration");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filteredSeminars = selectedBranch 
    ? seminars.filter(s => s.branch === selectedBranch) 
    : seminars;

  const exportToGoogleSheet = () => {
    const headers = ['ID', 'Name', 'Age', 'Branch', 'Payment Status', 'UTR Number', 'Submission Date'];
    
    const rows = filteredSeminars.map(s => [
      s.id,
      s.name,
      s.age || '-',
      s.branch,
      s.status,
      s.transactionId || '-',
      new Date(s.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seminars_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Seminar Registrations</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <select 
            className="form-group" 
            style={{ padding: '0.5rem', background: '#111', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', margin: 0, minWidth: '200px' }}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
          <button className="btn btn-outline" onClick={exportToGoogleSheet}>Export to Google Sheet</button>
        </div>
      </div>
      
      <div style={{ overflowX: 'hidden' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Age</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
              <th style={{ padding: '1rem' }}>UTR / Proof</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSeminars.map((seminar, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="ID" style={{ padding: '1rem' }}>{seminar.id}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{seminar.name}</td>
                <td data-label="Age" style={{ padding: '1rem' }}>{seminar.age}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{seminar.branch}</td>
                <td data-label="Payment Status" style={{ padding: '1rem', color: seminar.status === 'Verified' ? 'green' : 'var(--secondary)' }}>{seminar.status}</td>
                <td data-label="UTR / Proof" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>{seminar.transactionId}</div>
                  {seminar.paymentScreenshot && (
                    <a href={seminar.paymentScreenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>View Screenshot</a>
                  )}
                </td>
                <td data-label="Action" style={{ padding: '1rem' }}>
                  <button 
                    className={seminar.status === 'Verified' ? "btn btn-outline" : "btn btn-primary"} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => seminar.status !== 'Verified' && handleVerify(seminar.id)}
                  >
                    {seminar.status === 'Verified' ? 'View' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredSeminars.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No seminars found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
