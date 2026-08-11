"use client";

import { useState, useEffect } from 'react';



export default function AdminExams() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [exams, setExams] = useState<any[]>([]);

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
          setExams(data.filter(r => r.category === 'Belt Exam'));
        }
      });
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setExams(exams.map(e => e.id === id ? { ...e, status: 'Verified' } : e));
      } else {
        alert("Failed to verify registration");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filteredExams = selectedBranch 
    ? exams.filter(s => s.branch === selectedBranch) 
    : exams;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Belt Exams List</h1>
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
          <button className="btn btn-outline">Export to Excel</button>
        </div>
      </div>
      
      <div style={{ overflowX: 'hidden' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Current Belt</th>
              <th style={{ padding: '1rem' }}>Appearing Belt</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
              <th style={{ padding: '1rem' }}>UTR / Proof</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="ID" style={{ padding: '1rem' }}>{exam.id}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{exam.name}</td>
                <td data-label="Current Belt" style={{ padding: '1rem' }}>{exam.currentBelt}</td>
                <td data-label="Appearing Belt" style={{ padding: '1rem' }}>{exam.appearingBelt}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{exam.branch}</td>
                <td data-label="Payment Status" style={{ padding: '1rem', color: exam.status === 'Verified' ? 'green' : 'var(--secondary)' }}>{exam.status}</td>
                <td data-label="UTR / Proof" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>{exam.transactionId}</div>
                  {exam.paymentScreenshot && (
                    <a href={exam.paymentScreenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>View Screenshot</a>
                  )}
                </td>
                <td data-label="Action" style={{ padding: '1rem' }}>
                  <button 
                    className={exam.status === 'Verified' ? "btn btn-outline" : "btn btn-primary"} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => exam.status !== 'Verified' && handleVerify(exam.id)}
                  >
                    {exam.status === 'Verified' ? 'View' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredExams.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No exams found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
