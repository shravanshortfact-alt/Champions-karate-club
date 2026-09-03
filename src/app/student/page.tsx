"use client";

import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';


export default function StudentDashboard() {
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard Data State
  const [records, setRecords] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Check session on mount
  useEffect(() => {
    const savedName = localStorage.getItem('studentPortal_name');
    if (savedName) {
      fetchStudentData(savedName);
    }
    
    // Fetch available events for the medal claim form
    fetch('/api/events')
      .then(res => res.json())
      .then((data: any) => {
        if(Array.isArray(data)) setEvents(data);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, password })
      });
      const data: any = await res.json();
      
      if (res.ok) {
        localStorage.setItem('studentPortal_name', data.studentName);
        fetchStudentData(data.studentName);
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [claimEventId, setClaimEventId] = useState('');
  const [claimLevel, setClaimLevel] = useState('Classroom');
  const [claimMedal, setClaimMedal] = useState('Gold');
  const [claimLoading, setClaimLoading] = useState(false);

  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Image Crop State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = async () => {
    if (!profile || !imageSrc || !croppedAreaPixels) return;
    setUploadingProfile(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'profile.jpg');
      
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (uploadData.url) {
        const updateRes = await fetch('/api/student/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: profile.id, profilePhotoUrl: uploadData.url })
        });
        const updateData = await updateRes.json();
        
        if (updateData.success) {
          alert('Profile photo updated successfully!');
          setProfile({ ...profile, profilePhotoUrl: uploadData.url });
          setImageSrc(null); // close cropper
        } else {
          alert('Failed to update profile: ' + updateData.error);
        }
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during upload.');
    } finally {
      setUploadingProfile(false);
    }
  };

  const subscribeToPushNotifications = async (studentId: string) => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      try {
        if (Notification.permission === 'denied') {
          console.warn('Push notifications are blocked by the user.');
          return;
        }

        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready; // Ensure it's active

        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!publicVapidKey) {
            console.error('VAPID public key not found');
            return;
          }
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
          });
        }
        
        await fetch('/api/student/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, studentId })
        });
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
  };

  const fetchStudentData = async (name: string) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(name)}`);
      const data: any = await res.json();
      
      if (res.ok) {
        setRecords(data.registrations || []);
        setProfile(data.profile || null);
        setAchievements(data.achievements || []);        setLoginStep('dashboard');
        if (data.profile?.id) {
          subscribeToPushNotifications(data.profile.id);
        }
      } else {
        setError(data.error || 'No records found.');
        handleLogout();
      }
    } catch (err) {
      setError('An error occurred while fetching data.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !claimEventId) return;
    setClaimLoading(true);
    try {
      const res = await fetch('/api/student/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: profile.id,
          eventId: claimEventId,
          level: claimLevel,
          medal: claimMedal
        })
      });
      const data: any = await res.json();
      if (data.success) {
        alert("Medal claim submitted successfully! It is now pending Admin approval.");
        fetchStudentData(studentName); // Refresh to show pending status if I update the UI
        setClaimEventId('');
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setClaimLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: profile.id,
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput
        })
      });
      const data: any = await res.json();
      if (data.success) {
        alert("Password updated successfully!");
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setPassword(newPasswordInput);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('studentPortal_name');
    setStudentName('');
    setPassword('');
    setProfile(null);
    setRecords([]);
    setAchievements([]);
    setLoginStep('login');
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem 6rem', minHeight: '80vh', maxWidth: '600px', margin: '0 auto' }}>
      
      {loginStep !== 'dashboard' && (
        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', width: '100%' }}>
          <button 
            onClick={() => window.history.back()} 
            style={{ 
              position: 'absolute',
              left: '0px',
              top: '0px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.1)', 
              color: 'var(--text-main)', 
              border: 'none',
              cursor: 'pointer',
              zIndex: 10
            }}
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>

          <h1 className="text-primary" style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 800, paddingLeft: '40px', paddingRight: '40px' }}>
            Student Portal Login
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', color: '#a1a1aa' }}>
            Login with your Student Name and Password to view records.
          </p>
        </div>
      )}

      {error && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'center', borderColor: '#ef4444' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Login Step */}
      {loginStep === 'login' && (
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto 3rem auto' }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Student Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #a1a1aa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0'
                  }}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      )}

      {/* Dashboard View */}
      {loginStep === 'dashboard' && profile && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 className="text-primary" style={{ margin: 0 }}>Student Dashboard</h1>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </div>

          {profile && (
          <div className="card" style={{ 
            marginBottom: '3rem', 
            padding: '2rem',
            background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
            border: '1px solid rgba(255, 51, 51, 0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                border: '3px solid var(--primary)',
                boxShadow: '0 0 20px rgba(255, 51, 51, 0.3)'
              }}>
                <img src={profile.profilePhotoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (records[0]?.name || studentName)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '2rem' }}>{records[0]?.name || studentName}</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ background: '#222', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #333' }}>
                    <strong>Belt:</strong> {profile.currentBelt}
                  </span>
                  <span style={{ background: 'rgba(255, 215, 0, 0.1)', color: 'gold', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                    🏆 <strong>Points:</strong> {profile.totalPoints}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

          {achievements.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid rgba(255, 51, 51, 0.3)', paddingBottom: '0.5rem', display: 'inline-block' }}>Medals & Achievements</h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {achievements.map((ach, i) => (
                  <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', position: 'relative',
                    background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                    borderRadius: '12px',
                    border: ach.status === 'Pending' ? '1px dashed #fbbf24' : '1px solid #27272a',
                    boxShadow: ach.status === 'Pending' ? 'none' : '0 10px 25px rgba(0,0,0,0.4)',
                    transition: 'transform 0.3s ease',
                    cursor: 'default'
                  }}>
                    {ach.status === 'Pending' && <span style={{ position: 'absolute', top: -10, right: 10, background: '#fbbf24', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending Approval</span>}
                    <div style={{ 
                      fontSize: '3.5rem',
                      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                      opacity: ach.status === 'Pending' ? 0.5 : 1
                    }}>
                      {ach.medal === 'Gold' ? '🥇' : ach.medal === 'Silver' ? '🥈' : ach.medal === 'Bronze' ? '🥉' : '🎖️'}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '600' }}>{ach.event?.name}</h4>
                      <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{ach.level} Level</p>
                      <p style={{ 
                        margin: 0, fontSize: '0.95rem', fontWeight: 'bold',
                        color: ach.medal === 'Gold' ? '#fbbf24' : ach.medal === 'Silver' ? '#d4d4d8' : ach.medal === 'Bronze' ? '#b45309' : 'var(--primary)' 
                      }}>
                        {ach.medal} {ach.status !== 'Pending' && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(+{ach.pointsEarned} pts)</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="card" style={{ 
              marginBottom: '3rem', 
              background: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '2rem'
            }}>
              <h2 style={{ color: '#fbbf24', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Claim Medal (Student)</h2>
              <form onSubmit={handleClaimSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#a1a1aa', marginBottom: '0.5rem', display: 'block' }}>Select Event</label>
                  <select 
                    value={claimEventId} 
                    onChange={(e) => setClaimEventId(e.target.value)} 
                    required 
                    style={{ 
                      padding: '0.8rem', 
                      background: '#0a0a0a', 
                      border: '1px solid #3f3f46', 
                      color: 'white', 
                      borderRadius: '4px', 
                      width: '100%',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map((ev, idx) => (
                      <option key={idx} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem', display: 'flex' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: '#a1a1aa', marginBottom: '0.5rem', display: 'block' }}>Level</label>
                    <select 
                      value={claimLevel} 
                      onChange={(e) => setClaimLevel(e.target.value)} 
                      style={{ padding: '0.8rem', background: '#0a0a0a', border: '1px solid #3f3f46', color: 'white', borderRadius: '4px', width: '100%', outline: 'none' }}
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="District">District</option>
                      <option value="State">State</option>
                      <option value="National">National</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: '#a1a1aa', marginBottom: '0.5rem', display: 'block' }}>Medal (Rank)</label>
                    <select 
                      value={claimMedal} 
                      onChange={(e) => setClaimMedal(e.target.value)} 
                      style={{ padding: '0.8rem', background: '#0a0a0a', border: '1px solid #3f3f46', color: 'white', borderRadius: '4px', width: '100%', outline: 'none' }}
                    >
                      <option value="Gold">Rank 1 (Gold)</option>
                      <option value="Silver">Rank 2 (Silver)</option>
                      <option value="Bronze">Rank 3 (Bronze)</option>
                      <option value="Participation">Participation</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={claimLoading} 
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    background: 'transparent', 
                    border: '1px solid #fbbf24', 
                    color: '#fbbf24', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    cursor: claimLoading ? 'not-allowed' : 'pointer',
                    opacity: claimLoading ? 0.7 : 1
                  }}
                >
                  {claimLoading ? 'SUBMITTING...' : 'CLAIM MEDAL'}
                </button>
              </form>
            </div>
          )}

          <h2 style={{ marginBottom: '2rem', color: 'var(--secondary)' }}>Registration History</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {records.map((record, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <h3 className="text-primary">{record.category}</h3>
                  <span style={{ 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    background: record.status === 'Verified' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    color: record.status === 'Verified' ? '#4ade80' : '#fbbf24'
                  }}>
                    {record.status}
                  </span>
                </div>
                
                <p><strong>ID:</strong> {record.id}</p>
                <p><strong>Branch:</strong> {record.branch}</p>
                
                {record.category === 'Belt Exam' && (
                  <>
                    <p><strong>Current Belt:</strong> {record.currentBelt}</p>
                    <p><strong>Appearing For:</strong> {record.appearingBelt}</p>
                  </>
                )}
                
                {record.category === 'Competition' && (
                  <>
                    <p><strong>Weight:</strong> {record.weight} kg</p>
                    <p><strong>Height:</strong> {record.height} cm</p>
                  </>
                )}
                
                <p><strong>Date:</strong> {new Date(record.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Account Settings */}
          <h2 style={{ margin: '3rem 0 1.5rem', color: 'var(--secondary)' }}>Account Settings</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Change Password */}
            <div className="card" style={{ background: '#1a1a1a', border: '1px solid #333', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-outline" disabled={passwordLoading} style={{ width: '100%', marginTop: '1rem' }}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
            {/* Profile Picture Upload */}
            <div className="card" style={{ background: '#1a1a1a', border: '1px solid #333', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Profile Picture</h3>
              
              {!imageSrc ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1.5rem', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img src={profile.profilePhotoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (records[0]?.name || studentName)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button type="button" className="btn btn-outline" style={{ cursor: 'pointer' }}>Choose New Photo</button>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                  <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Zoom</label>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => {
                        setZoom(Number(e.target.value))
                      }}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                    <button type="button" className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setImageSrc(null)}>Cancel</button>
                    <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleProfileUpload} disabled={uploadingProfile}>
                      {uploadingProfile ? 'Saving...' : 'Save Photo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
