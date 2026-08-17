"use client";

import { useState, useEffect } from 'react';

export default function AdminAdmissions() {
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

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
          setAdmissions(data.filter(r => r.category === 'Admission'));
        }
      });
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'PATCH' });
      const data: any = await res.json();
      if (data.success) {
        setAdmissions(admissions.map(a => a.id === id ? { ...a, status: 'Verified' } : a));
        
        if (data.generatedPassword) {
          const msg = `Welcome to Champions Karate Club! 🥋\n\nYour Student Portal credentials have been created:\n*Student Name:* ${data.studentName}\n*Password:* ${data.generatedPassword}\n*Student Id:* ${data.studentId}\n\nPlease login at our website to view your dashboard 🔥`;
          
          if (data.whatsappNumber) {
            const phone = data.whatsappNumber.replace(/[^0-9]/g, '');
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
          } else {
            alert(`Credentials Generated:\n\nStudent Name: ${data.studentName}\nPassword: ${data.generatedPassword}\nStudent Id: ${data.studentId}\n\nPlease share this with the student manually.`);
          }
        }
      } else {
        alert("Failed to verify registration");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const filteredAdmissions = selectedBranch 
    ? admissions.filter(s => s.branch === selectedBranch) 
    : admissions;

  const exportToGoogleSheet = () => {
    const headers = ['ID', 'Name', 'Age', 'DOB', 'WhatsApp', 'Branch', 'Payment Status', 'UTR Number', 'Submission Date'];
    
    const rows = filteredAdmissions.map(a => [
      a.id,
      a.name,
      a.age,
      a.dob || '-',
      a.whatsappNumber || '-',
      a.branch,
      a.status,
      a.transactionId || '-',
      new Date(a.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admissions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-primary" style={{ margin: 0, minWidth: '250px' }}>Admission Forms List</h1>
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
            {filteredAdmissions.map((admission, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td data-label="ID" style={{ padding: '1rem' }}>{admission.id}</td>
                <td data-label="Name" style={{ padding: '1rem' }}>{admission.name}</td>
                <td data-label="Age" style={{ padding: '1rem' }}>{admission.age}</td>
                <td data-label="Branch" style={{ padding: '1rem' }}>{admission.branch}</td>
                <td data-label="Payment Status" style={{ padding: '1rem', color: admission.status === 'Verified' ? 'green' : 'var(--secondary)' }}>{admission.status}</td>
                <td data-label="UTR / Proof" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>{admission.transactionId}</div>
                  {admission.paymentScreenshot && (
                    <a href={admission.paymentScreenshot} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'underline' }}>View Screenshot</a>
                  )}
                </td>
                <td data-label="Action" style={{ padding: '1rem' }}>
                  <button 
                    className={admission.status === 'Verified' ? "btn btn-outline" : "btn btn-primary"} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      if (admission.status !== 'Verified') {
                        handleVerify(admission.id);
                      } else {
                        setSelectedAdmission(admission);
                      }
                    }}
                  >
                    {admission.status === 'Verified' ? 'View' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredAdmissions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No admissions found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {selectedAdmission && (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          maxWidth: '600px', width: '90%', maxHeight: '85vh', overflowY: 'auto', position: 'relative',
          background: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', padding: '2rem'
        }}>
          <button 
            onClick={() => setSelectedAdmission(null)}
            style={{ position: 'absolute', top: '15px', right: '15px', background: '#3f3f46', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.8rem', fontSize: '1.5rem', marginTop: 0 }}>Admission Details</h2>
          
          <div className="grid grid-cols-2" style={{ gap: '1.2rem', background: '#09090b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a' }}>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Student Name</strong> <div style={{fontSize: '1.1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.name}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Registration No</strong> <div style={{fontSize: '1.1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.id}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Branch</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.branch}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Age</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.age} Years</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Date of Birth</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.dob || '-'}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>WhatsApp No</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.whatsappNumber || '-'}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Submission Date</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{new Date(selectedAdmission.createdAt).toLocaleDateString()}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Payment Status</strong> <div style={{fontSize: '1rem', marginTop: '4px', fontWeight: 'bold', color: selectedAdmission.status === 'Verified' ? '#4ade80' : '#fbbf24'}}>{selectedAdmission.status}</div></div>
            <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Transaction ID</strong> <div style={{fontSize: '1rem', color: 'white', marginTop: '4px'}}>{selectedAdmission.transactionId || '-'}</div></div>
            {(() => {
              let pw = selectedAdmission.generatedPassword;
              if (!pw && selectedAdmission.extraData) {
                try {
                  const ed = JSON.parse(selectedAdmission.extraData);
                  pw = ed.generatedPassword;
                } catch(e) {}
              }
              if (pw) {
                return <div><strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Generated Password</strong> <div style={{fontSize: '1.1rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 'bold'}}>{pw}</div></div>;
              }
              return null;
            })()}
          </div>

          {selectedAdmission.paymentScreenshot && (
            <div style={{ marginTop: '2rem' }}>
              <strong style={{color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase'}}>Payment Screenshot</strong>
              <div style={{ marginTop: '0.8rem', border: '1px solid #3f3f46', borderRadius: '8px', overflow: 'hidden', padding: '0.5rem', background: '#09090b' }}>
                <img src={selectedAdmission.paymentScreenshot} alt="Payment Proof" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              </div>
            </div>
          )}
          
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1rem' }} onClick={() => setSelectedAdmission(null)}>Close Window</button>
        </div>
      </div>
    )}
    </>
  );
}
