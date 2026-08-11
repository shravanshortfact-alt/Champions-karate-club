"use client";

import { useState, useEffect } from 'react';



export default function AdminCompetitions() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [comps, setComps] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
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
      .then(data => {
        if (Array.isArray(data)) {
          setComps(data.filter(r => r.category === 'Competition'));
        }
      });
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setComps(comps.map(c => c.id === id ? { ...c, status: 'Verified' } : c));
      } else {
        alert("Failed to verify registration");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filteredComps = selectedBranch 
    ? comps.filter(s => s.branch === selectedBranch) 
    : comps;

  const exportToGoogleSheet = () => {
    const headers = ['ID', 'Name', 'Belt', 'Weight/Height', 'Branch', 'Payment Status', 'UTR Number', 'Submission Date'];
    
    const rows = filteredComps.map(c => [
      c.id,
      c.name,
      c.belt || '-',
      c.stats || '-',
      c.branch,
      c.status,
      c.transactionId || '-',
      new Date(c.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `competitions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Competition Registrations</h1>
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
              <th style={{ padding: '1rem' }}>Belt</th>
              <th style={{ padding: '1rem' }}>Weight/Height</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
              <th style={{ padding: '1rem' }}>UTR / Proof</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredComps.map((comp, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="ID" style={{ padding: '1rem' }}>{comp.id}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{comp.name}</td>
                <td data-label="Belt" style={{ padding: '1rem' }}>{comp.belt}</td>
                <td data-label="Weight/Height" style={{ padding: '1rem' }}>{comp.stats}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{comp.branch}</td>
                <td data-label="Payment Status" style={{ padding: '1rem', color: comp.status === 'Verified' ? 'green' : 'var(--secondary)' }}>{comp.status}</td>
                <td data-label="UTR / Proof" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>{comp.transactionId}</div>
                  {comp.paymentScreenshot && (
                    <a href={comp.paymentScreenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>View Screenshot</a>
                  )}
                </td>
                <td data-label="Action" style={{ padding: '1rem' }}>
                  <button 
                    className={comp.status === 'Verified' ? "btn btn-outline" : "btn btn-primary"} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => comp.status !== 'Verified' && handleVerify(comp.id)}
                  >
                    {comp.status === 'Verified' ? 'View' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredComps.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No competitions found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
