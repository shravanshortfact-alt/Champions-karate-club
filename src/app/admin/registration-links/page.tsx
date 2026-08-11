"use client";

import { useState, useEffect } from 'react';

type RegLink = {
  title: string;
  description: string;
  link: string;
  fee?: string;
  qrCodeUrl?: string;
  branches?: { name: string, fee?: string, qrCodeUrl: string }[];
};

export default function RegistrationLinksAdmin() {
  const [links, setLinks] = useState<RegLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullSettings, setFullSettings] = useState<any>(null);
  const [newBranchInputs, setNewBranchInputs] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setFullSettings(data);
        setLinks(data.registrationLinks || []);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullSettings) return;

    const payload = {
      ...fullSettings,
      registrationLinks: links
    };
    
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    alert("Registration links saved successfully! The Home page is now updated.");
  };

  const addLink = () => {
    setLinks([...links, { title: 'New Form', description: '', link: '/register/admission', fee: '' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };


  const handleLinkChange = (index: number, field: keyof RegLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const handleLinkQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        handleLinkChange(index, 'qrCodeUrl', data.url);
        alert("QR Code uploaded successfully!");
      }
    } catch (error) {
      alert("Error uploading QR Code.");
    }
  };

  const addLinkBranch = (linkIndex: number) => {
    const branchName = newBranchInputs[linkIndex];
    if (!branchName || !branchName.trim()) return;
    const newLinks = [...links];
    if (!newLinks[linkIndex].branches) newLinks[linkIndex].branches = [];
    newLinks[linkIndex].branches!.push({ name: branchName.trim(), fee: '', qrCodeUrl: '' });
    setLinks(newLinks);
    setNewBranchInputs({...newBranchInputs, [linkIndex]: ''});
  };

  const removeLinkBranch = (linkIndex: number, branchIndex: number) => {
    const newLinks = [...links];
    newLinks[linkIndex].branches!.splice(branchIndex, 1);
    setLinks(newLinks);
  };

  const handleLinkBranchChange = (linkIndex: number, branchIndex: number, field: string, value: string) => {
    const newLinks = [...links];
    (newLinks[linkIndex].branches![branchIndex] as any)[field] = value;
    setLinks(newLinks);
  };

  const handleLinkBranchQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, linkIndex: number, branchIndex: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const newLinks = [...links];
        newLinks[linkIndex].branches![branchIndex].qrCodeUrl = data.url;
        setLinks(newLinks);
        alert("Branch QR Code uploaded!");
      }
    } catch (error) {}
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-primary" style={{ margin: 0 }}>Registration Links Settings</h1>
        <button type="button" className="btn btn-outline" onClick={addLink}>+ Add New Link</button>
      </div>
      
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
          {links.map((linkItem, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem', background: '#111', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--secondary)' }}>Form: {linkItem.title}</h3>
                <button type="button" onClick={() => removeLink(i)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
              
              <div className="form-group">
                <label>Title (e.g. Admission)</label>
                <input 
                  type="text" 
                  value={linkItem.title} 
                  onChange={(e) => handleLinkChange(i, 'title', e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description (e.g. Join the academy)</label>
                <input 
                  type="text" 
                  value={linkItem.description} 
                  onChange={(e) => handleLinkChange(i, 'description', e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Form Template</label>
                <select 
                  value={linkItem.link} 
                  onChange={(e) => handleLinkChange(i, 'link', e.target.value)} 
                  required
                >
                  <option value="/register/admission">Admission Form Layout</option>
                  <option value="/register/belt-exam">Belt Exam Form Layout</option>
                  <option value="/register/competition">Competition Form Layout</option>
                  <option value="/register/seminar">Seminar Form Layout</option>
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Choose which layout this link should use. You can safely reuse layouts.
                </p>
              </div>
              <div className="form-group">
                <label>Registration Fee (₹)</label>
                <input 
                  type="text" 
                  value={linkItem.fee || ''} 
                  onChange={(e) => handleLinkChange(i, 'fee', e.target.value)} 
                  placeholder="e.g. 1500"
                />
              </div>
              <div className="form-group" style={{ padding: '1rem', background: '#1A1A1A', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Form Branches, Fees & QR Codes</h4>
                
                {(!linkItem.branches || linkItem.branches.length === 0) && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No branches added. Please add branches below.</p>
                )}

                {linkItem.branches && linkItem.branches.map((b, bIdx) => (
                  <div key={bIdx} style={{ background: '#222', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <strong style={{ color: 'white' }}>{b.name}</strong>
                      <button type="button" onClick={() => removeLinkBranch(i, bIdx)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Branch Fee (₹)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 1500" 
                          value={b.fee || ''} 
                          onChange={(e) => handleLinkBranchChange(i, bIdx, 'fee', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', background: '#333', color: 'white', border: '1px solid var(--border-color)', marginTop: '0.2rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {b.qrCodeUrl && <img src={b.qrCodeUrl} alt="QR" style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                      <input type="file" accept="image/*" onChange={(e) => handleLinkBranchQrUpload(e, i, bIdx)} />
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="New Branch Name" 
                    value={newBranchInputs[i] || ''} 
                    onChange={(e) => setNewBranchInputs({...newBranchInputs, [i]: e.target.value})} 
                    style={{ flex: 1, padding: '0.5rem', background: '#222', color: 'white', border: '1px solid var(--border-color)' }}
                  />
                  <button type="button" className="btn btn-outline" onClick={() => addLinkBranch(i)} style={{ padding: '0.5rem 1rem' }}>Add Branch</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', marginBottom: '4rem' }}>
          Save Registration Links
        </button>
      </form>
    </div>
  );
}
