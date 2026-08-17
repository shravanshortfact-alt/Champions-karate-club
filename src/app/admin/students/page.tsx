"use client";

import { useState, useEffect } from 'react';


export default function AdminStudents() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    // Fetch branches from DB if available, for now using settings logic or Prisma
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

    fetch('/api/students?status=Active')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
      });
  }, []);

  const handleArchive = async (id: string) => {
    if (confirm("Are you sure you want to archive this student?")) {
      try {
        const res = await fetch(`/api/students`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'Archived' })
        });
        const data: any = await res.json();
        if (data.success) {
          setStudents(students.filter(s => s.id !== id));
        } else {
          alert("Failed to archive student");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this student? All related data will be lost.")) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        const data: any = await res.json();
        if (data.success) {
          setStudents(students.filter(s => s.id !== id));
        } else {
          alert("Failed to delete student");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while deleting");
      }
    }
  };

  const filteredStudents = selectedBranch 
    ? students.filter(s => s.branch?.name === selectedBranch) 
    : students;

  const exportToGoogleSheet = () => {
    const headers = ['Registration No', 'Name', 'Age', 'Branch', 'Current Belt'];
    
    const rows = filteredStudents.map(student => [
      student.registrationNumber || '-',
      student.name || '-',
      student.age || '-',
      student.branch?.name || 'N/A',
      student.currentBelt || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Active Students List</h1>
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
              <th style={{ padding: '1rem' }}>Reg No.</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Age</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Current Belt</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="Reg No." style={{ padding: '1rem' }}>{student.registrationNumber}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{student.name}</td>
                <td data-label="Age" style={{ padding: '1rem' }}>{student.age}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{student.branch?.name || 'N/A'}</td>
                <td data-label="Current Belt" style={{ padding: '1rem', color: 'var(--primary)' }}>{student.currentBelt}</td>
                <td data-label="Action" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger-color, red)', color: 'var(--danger-color, red)' }}
                    onClick={() => handleArchive(student.id)}
                  >
                    Archive
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'red', color: 'red', background: 'rgba(255,0,0,0.1)' }}
                    onClick={() => handleDelete(student.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
    </>
  );
}
