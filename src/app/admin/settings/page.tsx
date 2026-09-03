"use client";

import { useState, useEffect } from 'react';

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
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

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
      })
      .catch(() => setIsLoading(false));
  }, []);

  const saveSettingsPayload = async (sectionName: string, successMessage: string) => {
    setSavingSection(sectionName);
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
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(successMessage);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert("Error saving " + sectionName + "! " + (errData.error || "Please try again."));
      }
    } catch (err: any) {
      alert("Network error saving " + sectionName + ": " + (err?.message || "Please check connection."));
    } finally {
      setSavingSection(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingField('logo');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        alert("Logo uploaded successfully! Please click 'Save Academy General Settings' below to save it permanently.");
      }
    } catch (error) {
      alert("Error uploading logo file.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleInstructorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingField(`instructor-${index}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.url) {
        handleInstructorChange(index, 'photoUrl', data.url);
        alert("Instructor photo uploaded! Please click 'Save Instructors' below to save changes.");
      }
    } catch (error) {
      alert("Error uploading photo.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleInstructorChange = (index: number, field: keyof Instructor, value: string | number) => {
    const newInstructors = [...instructors];
    newInstructors[index] = { ...newInstructors[index], [field]: field === 'medals' ? Number(value) : value };
    setInstructors(newInstructors);
  };

  const addInstructor = () => {
    setInstructors([...instructors, { name: '', rank: '', experience: '', photoUrl: '', medals: 0 }]);
  };

  const removeInstructor = (index: number) => {
    const newInstructors = [...instructors];
    newInstructors.splice(index, 1);
    setInstructors(newInstructors);
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    const newA = [...achievements];
    newA.splice(index, 1);
    setAchievements(newA);
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
    setUploadingField(`video-${index}`);
    
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
        alert("Video uploaded successfully! Please click 'Save Homepage Videos' below to save changes permanently.");
      }
    } catch (error) {
      alert("Error uploading video.");
    } finally {
      setUploadingField(null);
    }
  };

  if (isLoading) return <div style={{ color: '#fff', padding: '2rem' }}>Loading settings...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
      <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Site Settings</h1>
      
      {/* 1. Form Access Control (Locks) Section */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: '#18181b' }}>
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Form Access Control (Locks)</h2>
        <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={formLocks.competition} 
              onChange={e => setFormLocks({...formLocks, competition: e.target.checked})} 
              style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }} 
            />
            <label style={{ margin: 0, cursor: 'pointer', color: '#fff' }}>Lock Competition Form</label>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={formLocks.seminar} 
              onChange={e => setFormLocks({...formLocks, seminar: e.target.checked})} 
              style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }} 
            />
            <label style={{ margin: 0, cursor: 'pointer', color: '#fff' }}>Lock Seminar Form</label>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={formLocks.beltExam} 
              onChange={e => setFormLocks({...formLocks, beltExam: e.target.checked})} 
              style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }} 
            />
            <label style={{ margin: 0, cursor: 'pointer', color: '#fff' }}>Lock Belt Exam Form</label>
          </div>
        </div>
        <button 
          type="button" 
          disabled={savingSection === 'formLocks'}
          onClick={() => saveSettingsPayload('formLocks', 'Form Lock settings saved successfully!')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          {savingSection === 'formLocks' ? 'Saving Lock Settings...' : 'Save Form Lock Settings'}
        </button>
      </div>

      {/* 2. Academy General Settings Section */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: '#18181b' }}>
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Academy General</h2>
        
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Upload Logo</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {logoUrl && <img src={logoUrl} alt="Logo Preview" style={{ height: '60px', width: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#000' }} />}
            <input 
              type="file" 
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingField === 'logo'}
              style={{ color: '#fff' }}
            />
            {uploadingField === 'logo' && <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>Uploading logo...</span>}
          </div>
          {logoUrl && (
            <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.5rem', wordBreak: 'break-all' }}>
              Current Logo: {logoUrl.startsWith('data:') ? '[Base64 Encoded Image Loaded]' : logoUrl}
            </p>
          )}
        </div>
        
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Club UPI ID (for QR Payments)</label>
          <input 
            type="text" 
            value={upiId} 
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g., championkarate@upi"
            style={{ padding: '0.8rem', background: '#09090b', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', width: '100%' }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>WhatsApp Contact Number</label>
          <input 
            type="text" 
            placeholder="e.g. +919876543210 (Include country code)" 
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            style={{ padding: '0.8rem', background: '#09090b', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>Instagram Link</label>
          <input 
            type="text" 
            placeholder="e.g. https://instagram.com/karate_king_no1" 
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value)}
            style={{ padding: '0.8rem', background: '#09090b', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', width: '100%' }}
          />
        </div>

        <button 
          type="button" 
          disabled={savingSection === 'general'}
          onClick={() => saveSettingsPayload('general', 'Academy General settings saved successfully!')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          {savingSection === 'general' ? 'Saving General Settings...' : 'Save Academy General Settings'}
        </button>
      </div>

      {/* 3. Instructors / Masters Section */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: '#18181b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.4rem' }}>Masters / Instructors</h2>
          <button type="button" className="btn btn-outline" onClick={addInstructor}>+ Add Master</button>
        </div>
        
        {instructors.map((instructor, i) => (
          <div key={i} style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Master #{i + 1}</h3>
              <button type="button" onClick={() => removeInstructor(i)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#fff' }}>Name</label>
              <input type="text" value={instructor.name} onChange={(e) => handleInstructorChange(i, 'name', e.target.value)} style={{ padding: '0.6rem', background: '#18181b', border: '1px solid #333', color: 'white', borderRadius: '4px', width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#fff' }}>Rank / Title</label>
              <input type="text" value={instructor.rank} onChange={(e) => handleInstructorChange(i, 'rank', e.target.value)} style={{ padding: '0.6rem', background: '#18181b', border: '1px solid #333', color: 'white', borderRadius: '4px', width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#fff' }}>Total Medals</label>
              <input type="number" value={instructor.medals || 0} onChange={(e) => handleInstructorChange(i, 'medals', e.target.value)} style={{ padding: '0.6rem', background: '#18181b', border: '1px solid #333', color: 'white', borderRadius: '4px', width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#fff' }}>Experience (Bio)</label>
              <textarea rows={3} value={instructor.experience} onChange={(e) => handleInstructorChange(i, 'experience', e.target.value)} style={{ padding: '0.6rem', background: '#18181b', border: '1px solid #333', color: 'white', borderRadius: '4px', width: '100%' }} />
            </div>
            <div className="form-group">
              <label style={{ color: '#fff' }}>Instructor Photo</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {instructor.photoUrl && <img src={instructor.photoUrl} alt="Preview" style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleInstructorPhotoUpload(e, i)}
                  style={{ color: '#fff' }}
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          type="button" 
          disabled={savingSection === 'instructors'}
          onClick={() => saveSettingsPayload('instructors', 'Instructors saved successfully!')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          {savingSection === 'instructors' ? 'Saving Instructors...' : 'Save Masters / Instructors'}
        </button>
      </div>

      {/* 4. Achievements List Section */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: '#18181b' }}>
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Achievements List</h2>
        <ul style={{ listStyle: 'none', marginBottom: '1.5rem', padding: 0 }}>
          {achievements.map((a, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#09090b', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #27272a', alignItems: 'center' }}>
              <span style={{ color: '#fff', wordBreak: 'break-word', flex: 1 }}>{a}</span>
              <button type="button" onClick={() => removeAchievement(i)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="e.g. 5x National Champion" 
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', background: '#09090b', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px' }}
          />
          <button type="button" className="btn btn-outline" onClick={addAchievement}>+ Add Achievement</button>
        </div>

        <button 
          type="button" 
          disabled={savingSection === 'achievements'}
          onClick={() => saveSettingsPayload('achievements', 'Achievements saved successfully!')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          {savingSection === 'achievements' ? 'Saving Achievements...' : 'Save Achievements'}
        </button>
      </div>

      {/* 5. Homepage Vertical Videos Section */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: '#18181b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.4rem' }}>Homepage Videos (Vertical)</h2>
          <button type="button" className="btn btn-outline" onClick={addVideo}>+ Add Video</button>
        </div>
        
        <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          {videos.map((vid, i) => (
            <div key={i} style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>Video #{i + 1}</h3>
                <button type="button" onClick={() => removeVideo(i)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>Video Title</label>
                <input 
                  type="text" 
                  value={vid.title} 
                  onChange={(e) => handleVideoChange(i, e.target.value)} 
                  placeholder="e.g. Training Session"
                  style={{ padding: '0.6rem', background: '#18181b', border: '1px solid #333', color: 'white', borderRadius: '4px', width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>Upload Vertical Video (.mp4)</label>
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e, i)}
                  disabled={uploadingField === `video-${i}`}
                  style={{ padding: '0.6rem', border: '1px solid #333', borderRadius: '4px', width: '100%', color: '#fff' }}
                />
                {uploadingField === `video-${i}` && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>Processing video file...</p>}
                {vid.url && (
                  <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                    Current Video: {vid.url.startsWith('data:') ? '[Base64 Encoded Video Loaded]' : vid.url}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          disabled={savingSection === 'videos'}
          onClick={() => saveSettingsPayload('videos', 'Homepage Videos saved successfully!')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          {savingSection === 'videos' ? 'Saving Homepage Videos...' : 'Save Homepage Videos'}
        </button>
      </div>

      {/* Save All Settings Option at Bottom */}
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button 
          type="button" 
          disabled={savingSection !== null}
          onClick={() => saveSettingsPayload('all', 'All Settings saved successfully!')}
          className="btn btn-primary" 
          style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', opacity: savingSection ? 0.7 : 1, cursor: savingSection ? 'not-allowed' : 'pointer' }}
        >
          {savingSection === 'all' ? 'Saving All Settings...' : 'Save All Settings (Global)'}
        </button>
      </div>
    </div>
  );
}
