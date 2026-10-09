"use client";

import { useState, useEffect } from 'react';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Teacher Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiDisplayName, setUpiDisplayName] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState(true);

  // Edit Teacher Form
  const [editTeacher, setEditTeacher] = useState<any>(null);

  // Assign Branch Form
  const [assignModal, setAssignModal] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachersAndBranches();
  }, []);

  const fetchTeachersAndBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teachers');
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          password,
          upiId,
          upiDisplayName,
          paymentEnabled
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddModal(false);
        setName(''); setUsername(''); setPassword(''); setUpiId(''); setUpiDisplayName('');
        fetchTeachersAndBranches();
      } else {
        alert(data.error || "Failed to create teacher.");
      }
    } catch (e) {
      alert("Network error creating teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: editTeacher.id,
          name: editTeacher.name,
          password: editTeacher.password,
          upiId: editTeacher.upiId,
          upiDisplayName: editTeacher.upiDisplayName,
          paymentEnabled: editTeacher.paymentEnabled
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setEditTeacher(null);
        fetchTeachersAndBranches();
      } else {
        alert(data.error || "Failed to update teacher.");
      }
    } catch (e) {
      alert("Error updating teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignBranchId: assignModal.id,
          teacherId: selectedTeacherId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAssignModal(null);
        fetchTeachersAndBranches();
      } else {
        alert(data.error || "Failed to assign branch.");
      }
    } catch (e) {
      alert("Error assigning branch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-primary" style={{ margin: 0 }}>Teacher & UPI Management</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Configure individual teacher UPI IDs and assign branch ownership
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Teacher</button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem' }}>Loading teachers and branches...</div>
      ) : (
        <>
          {/* Teachers Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.4rem' }}>Instructors / Teachers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {teachers.map((t) => (
                <div key={t.id} className="card" style={{ padding: '1.5rem', borderRadius: '12px', background: '#111827', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{t.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Username: {t.username}</span>
                    </div>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', background: t.paymentEnabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: t.paymentEnabled ? '#4ade80' : '#ef4444' }}>
                      {t.paymentEnabled ? 'Payments Active' : 'Disabled'}
                    </span>
                  </div>

                  <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <div style={{ marginBottom: '0.4rem' }}>
                      <strong style={{ color: '#94a3b8' }}>UPI ID: </strong>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{t.upiId || 'Not Configured'}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#94a3b8' }}>Display Name: </strong>
                      <span style={{ color: 'white' }}>{t.upiDisplayName || t.name}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <strong style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Assigned Branches:</strong>
                    {t.branches && t.branches.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {t.branches.map((b: any) => (
                          <span key={b.id} style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {b.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>No branches assigned</span>
                    )}
                  </div>

                  <button className="btn btn-outline" onClick={() => setEditTeacher(t)} style={{ width: '100%', fontSize: '0.85rem' }}>
                    ⚙️ Edit Teacher & UPI ID
                  </button>
                </div>
              ))}

              {teachers.length === 0 && (
                <div className="card" style={{ gridColumn: '1 / -1', padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>
                  No teachers added yet. Click "+ Add New Teacher" above.
                </div>
              )}
            </div>
          </div>

          {/* Branch Assignment Section */}
          <div>
            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.4rem' }}>Branch → Teacher Assignment</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#111827', color: '#94a3b8', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem' }}>Branch Name</th>
                    <th style={{ padding: '1rem' }}>Address</th>
                    <th style={{ padding: '1rem' }}>Assigned Teacher</th>
                    <th style={{ padding: '1rem' }}>Teacher UPI ID</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>{b.name}</td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>{b.address || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        {b.teacher ? (
                          <strong style={{ color: '#60a5fa' }}>{b.teacher.name}</strong>
                        ) : (
                          <span style={{ color: '#ef4444' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#4ade80', fontSize: '0.9rem' }}>
                        {b.teacher?.upiId || '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setAssignModal(b);
                            setSelectedTeacherId(b.teacherId || 'NONE');
                          }}
                        >
                          Change Teacher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', background: '#1e293b' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Add New Teacher</h3>
            <form onSubmit={handleCreateTeacher}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Full Name</label>
                <input type="text" placeholder="e.g. Aman Sir" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Login Username</label>
                <input type="text" placeholder="e.g. aman" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Login Password</label>
                <input type="password" placeholder="Password for teacher portal" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Direct UPI ID</label>
                <input type="text" placeholder="e.g. aman@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#cbd5e1' }}>UPI Display Name</label>
                <input type="text" placeholder="e.g. Aman Sir" value={upiDisplayName} onChange={(e) => setUpiDisplayName(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', background: '#1e293b' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Edit Teacher: {editTeacher.name}</h3>
            <form onSubmit={handleUpdateTeacher}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Full Name</label>
                <input type="text" value={editTeacher.name} onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })} required style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Direct UPI ID</label>
                <input type="text" value={editTeacher.upiId || ''} onChange={(e) => setEditTeacher({ ...editTeacher, upiId: e.target.value })} placeholder="e.g. aman@upi" style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>UPI Display Name</label>
                <input type="text" value={editTeacher.upiDisplayName || ''} onChange={(e) => setEditTeacher({ ...editTeacher, upiDisplayName: e.target.value })} placeholder="e.g. Aman Sir" style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={editTeacher.paymentEnabled} onChange={(e) => setEditTeacher({ ...editTeacher, paymentEnabled: e.target.checked })} style={{ transform: 'scale(1.2)' }} />
                <label style={{ color: 'white' }}>Enable Direct UPI Payments</label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditTeacher(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Branch Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '2rem', borderRadius: '16px', background: '#1e293b' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Assign Teacher to {assignModal.name}</h3>
            <form onSubmit={handleAssignBranch}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#cbd5e1' }}>Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
                >
                  <option value="NONE">-- Unassign Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.upiId || 'No UPI ID'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Updating...' : 'Assign Branch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
