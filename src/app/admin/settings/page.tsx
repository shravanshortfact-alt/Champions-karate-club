"use client";

import { useState, useEffect } from 'react';

export const runtime = 'edge';


type Instructor = {
  name: string;
  rank: string;
  experience: string;
  photoUrl: string;
  medals?: number;
};

export default function AdminSettings() {
  const [upiId, setUpiId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [videos, setVideos] = useState<{title: string, url: string}[]>([]);
  const [formLocks, setFormLocks] = useState({ competition: false, seminar: false, beltExam: false });
  const [isLoading, setIsLoading] = useState(true);

  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then((data: any) => {
        setUpiId(data.upiId || '');
        setLogoUrl(data.logoUrl || '');
        setWhatsappNumber(data.whatsappNumber || '');
        setInstagramLink(data.instagramLink || '');
        setInstructors(data.instructors || []);
        setAchievements(data.achievements || []);
        setVideos(data.videos || []);
        setFormLocks(data.formLocks || { competition: false, seminar: false, beltExam: false });
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      upiId,
      logoUrl,
      whatsappNumber,
      instagramLink,
      instructors,
      achievements,
      videos,
      formLocks
    };
    
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert("Settings saved successfully! The Home page is now updated.");
    } else {
      const errData = await res.json().catch(() => ({}));
      alert("Error saving settings! " + (errData.error || "Please check the server logs."));
    }
  };



  const addAchievement = () => {
    if (newAchievement) {
      setAchievements([...achievements, newAchievement]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    const newA = [...achievements];
    newA.splice(index, 1);
    setAchievements(newA);
  };

  const addInstructor = () => {
    setInstructors([...instructors, { name: '', rank: '', experience: '', photoUrl: '', medals: 0 }]);
  };

  const removeInstructor = (index: number) => {
    const newInstructors = [...instructors];
    newInstructors.splice(index, 1);
    setInstructors(newInstructors);
  };

  const handleInstructorChange = (index: number, field: keyof Instructor, value: string | number) => {
    const newInstructors = [...instructors];
    newInstructors[index] = { ...newInstructors[index], [field]: field === 'medals' ? Number(value) : value };
    setInstructors(newInstructors);
  };


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.url) setLogoUrl(data.url);
    } catch (error) {
      alert("Error uploading file.");
    }
  };

  const handleInstructorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.url) handleInstructorChange(index, 'photoUrl', data.url);
    } catch (error) {
      alert("Error uploading file.");
    }
  };

  const handleVideoChange = (index: number, value: string) => {
    const newVideos = [...videos];
    newVideos[index].title = value;
    setVideos(newVideos);
  };

  const addVideo = () => {
    setVideos([...videos, { title: '', url: '' }]);
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    setVideos(newVideos);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // We notify user to wait as videos can take time
    alert("Uploading video, please wait...");
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.url) {
        const newVideos = [...videos];
        newVideos[index].url = data.url;
        setVideos(newVideos);
        alert("Video uploaded successfully!");
      }
    } catch (error) {
      alert("Error uploading video.");
    }
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Site Settings</h1>
      
      <form onSubmit={handleSave}>
        
        {/* Form Access Control Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Form Access Control (Locks)</h2>
          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formLocks.competition} onChange={e => setFormLocks({...formLocks, competition: e.target.checked})} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Lock Competition Form</label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formLocks.seminar} onChange={e => setFormLocks({...formLocks, seminar: e.target.checked})} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Lock Seminar Form</label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formLocks.beltExam} onChange={e => setFormLocks({...formLocks, beltExam: e.target.checked})} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Lock Belt Exam Form</label>
            </div>
          </div>
        </div>

        {/* Academy General Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Academy General</h2>
          <div className="form-group">
            <label>Upload Logo</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {logoUrl && <img src={logoUrl} alt="Logo Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Current Logo URL: {logoUrl || 'None'}</p>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Club UPI ID (for QR Payments)</label>
            <input 
              type="text" 
              value={upiId} 
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g., championkarate@upi"
              style={{ padding: '0.8rem', background: '#111', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', width: '100%' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>WhatsApp Contact Number</label>
            <input 
              type="text" 
              placeholder="e.g. +919876543210 (Include country code)" 
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Instagram Link</label>
            <input 
              type="text" 
              placeholder="e.g. https://instagram.com/yourclub" 
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
            />
          </div>
        </div>


        {/* Instructors Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ color: 'var(--secondary)', margin: 0 }}>Masters / Instructors</h2>
            <button type="button" className="btn btn-outline" onClick={addInstructor}>+ Add Master</button>
          </div>
          
          {instructors.map((instructor, i) => (
            <div key={i} style={{ background: '#111', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>Master #{i + 1}</h3>
                <button type="button" onClick={() => removeInstructor(i)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={instructor.name} onChange={(e) => handleInstructorChange(i, 'name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Rank / Title</label>
                <input type="text" value={instructor.rank} onChange={(e) => handleInstructorChange(i, 'rank', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Total Medals</label>
                <input type="number" value={instructor.medals || 0} onChange={(e) => handleInstructorChange(i, 'medals', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Experience (Bio)</label>
                <textarea rows={3} value={instructor.experience} onChange={(e) => handleInstructorChange(i, 'experience', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Instructor Photo</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {instructor.photoUrl && <img src={instructor.photoUrl} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleInstructorPhotoUpload(e, i)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Achievements Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Achievements List</h2>
          <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
            {achievements.map((a, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#1A1A1A', marginBottom: '0.5rem', borderRadius: '4px', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ wordBreak: 'break-word', flex: 1 }}>{a}</span>
                <button type="button" onClick={() => removeAchievement(i)} style={{ color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="e.g. 5x National Champion" 
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', background: '#1A1A1A', border: '1px solid var(--border-color)', color: 'white' }}
            />
            <button type="button" className="btn btn-outline" onClick={addAchievement}>Add Achievement</button>
          </div>
        </div>

        {/* Video Upload Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ color: 'var(--secondary)', margin: 0 }}>Homepage Videos (Vertical)</h2>
            <button type="button" className="btn btn-outline" onClick={addVideo}>+ Add Video</button>
          </div>
          
          <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
            {videos.map((vid, i) => (
              <div key={i} style={{ background: '#111', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'white', margin: 0 }}>Video #{i + 1}</h3>
                  <button type="button" onClick={() => removeVideo(i)} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
                <div className="form-group">
                  <label>Video Title</label>
                  <input 
                    type="text" 
                    value={vid.title} 
                    onChange={(e) => handleVideoChange(i, e.target.value)} 
                    placeholder="e.g. Training Session"
                  />
                </div>
                <div className="form-group">
                  <label>Upload Vertical Video (.mp4)</label>
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e, i)}
                    style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', wordBreak: 'break-all' }}>Current URL: {vid.url || 'None'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', marginBottom: '4rem' }}>
          Save All Settings
        </button>
      </form>
    </div>
  );
}
