"use client";

import { useState, useEffect } from 'react';



const allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AdminDashboard() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);

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
        if (Array.isArray(data)) setRegistrations(data);
      });
  }, []);

  const filteredRegistrations = registrations.filter(r => {
    const branchMatch = selectedBranch ? r.branch === selectedBranch : true;
    const monthMatch = selectedMonth ? r.month === selectedMonth : true;
    return branchMatch && monthMatch;
  });

  // Calculate dynamic totals for the dashboard
  const totalAdmissions = filteredRegistrations.filter(r => r.category === 'Admission').length;
  const pendingExams = filteredRegistrations.filter(r => r.category === 'Belt Exam').length;
  const totalCompetitors = filteredRegistrations.filter(r => r.category === 'Competition').length;
  const totalSeminar = filteredRegistrations.filter(r => r.category === 'Seminar').length;

  return (
    <div className="animate-fade-in">
      <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div className="grid grid-cols-4">
        <div className="card text-center">
          <h2 className="text-secondary" style={{ fontSize: '2.5rem' }}>{totalAdmissions}</h2>
          <p className="text-muted">Total Admissions</p>
        </div>
        <div className="card text-center">
          <h2 className="text-secondary" style={{ fontSize: '2.5rem' }}>{pendingExams}</h2>
          <p className="text-muted">Belt Exams</p>
        </div>
        <div className="card text-center">
          <h2 className="text-secondary" style={{ fontSize: '2.5rem' }}>{totalCompetitors}</h2>
          <p className="text-muted">Competitors</p>
        </div>
        <div className="card text-center">
          <h2 className="text-secondary" style={{ fontSize: '2.5rem' }}>{totalSeminar}</h2>
          <p className="text-muted">Seminar Attendees</p>
        </div>
      </div>

      <div style={{ marginTop: '3rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0, minWidth: '250px' }}>Recent Registrations</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <select 
            className="form-group" 
            style={{ width: '200px', padding: '0.5rem', background: '#111', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', marginBottom: 0 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Time</option>
            {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            className="form-group" 
            style={{ width: '200px', padding: '0.5rem', background: '#111', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', marginBottom: 0 }}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'hidden' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((reg, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="ID" style={{ padding: '1rem' }}>{reg.id}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{reg.name}</td>
                <td data-label="Category" style={{ padding: '1rem' }}>{reg.category}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{reg.branch}</td>
                <td data-label="Payment Status" style={{ padding: '1rem', color: reg.status === 'Verified' ? 'green' : 'var(--secondary)' }}>{reg.status}</td>
              </tr>
            ))}
            {filteredRegistrations.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No registrations found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
