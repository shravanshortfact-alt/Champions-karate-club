"use client";

import { useState, useEffect } from 'react';

export default function AdminArchives() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/students?status=Archived')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
      });
  }, []);

  const handleRestore = async (id: string) => {
    if (confirm("Are you sure you want to restore this student?")) {
      try {
        const res = await fetch(`/api/students`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'Active' })
        });
        const data: any = await res.json();
        if (data.success) {
          setStudents(students.filter(s => s.id !== id));
        } else {
          alert("Failed to restore student");
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

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Archived Students</h1>
      </div>
      
      <div style={{ overflowX: 'hidden' }}>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Reg No.</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Age</th>
              <th style={{ padding: '1rem' }}>Branch</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="Reg No." style={{ padding: '1rem' }}>{student.registrationNumber}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{student.name}</td>
                <td data-label="Age" style={{ padding: '1rem' }}>{student.age}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{student.branch?.name || 'N/A'}</td>
                <td data-label="Action" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'green', color: 'green' }}
                    onClick={() => handleRestore(student.id)}
                  >
                    Restore
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
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No archived students.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
