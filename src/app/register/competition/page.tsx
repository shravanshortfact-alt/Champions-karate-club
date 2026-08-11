"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CompetitionForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    belt: '',
    age: '',
    dob: '',
    weight: '',
    height: '',
    coachName: '',
    branch: '',
    category: 'Competition',
    transactionId: '',
    paymentScreenshot: '',
    profilePhotoUrl: ''
  });
  
  const belts = ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black"];
  const [branches, setBranches] = useState<{name: string, fee?: string, qrCodeUrl: string}[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('/qr.png');
  const [fee, setFee] = useState('0');
  const [baseFee, setBaseFee] = useState('1000');
  const [customQr, setCustomQr] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.formLocks?.competition) {
          setIsLocked(true);
        }
        setBranches(data.branches || []);
        const linkConfig = data.registrationLinks?.find((l: any) => l.link === '/register/competition');
        if (linkConfig) {
          if (linkConfig.fee) {
            setFee(linkConfig.fee);
            setBaseFee(linkConfig.fee);
          }
          if (linkConfig.qrCodeUrl) setCustomQr(linkConfig.qrCodeUrl);
          if (linkConfig.branches && linkConfig.branches.length > 0) {
            setBranches(linkConfig.branches);
          }
        }
      });
  }, []);
  useEffect(() => {
    const selectedBranch = branches.find(b => b.name === formData.branch);
    
    if (!formData.branch) {
      setFee('0');
    } else if (selectedBranch && selectedBranch.fee) {
      setFee(selectedBranch.fee);
    } else {
      setFee(baseFee);
    }
    
    if (selectedBranch && selectedBranch.qrCodeUrl) {
      setQrCodeUrl(selectedBranch.qrCodeUrl);
    } else if (customQr) {
      setQrCodeUrl(customQr);
    } else {
      setQrCodeUrl('/qr.png');
    }
  }, [formData.branch, branches, baseFee, customQr]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.belt && formData.age && formData.dob && formData.weight && formData.height && formData.coachName && formData.branch) {
      setStep(2);
    } else {
      alert("Please fill all details.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transactionId) {
      alert("Please enter the Payment Transaction ID.");
      return;
    }
    if (!formData.paymentScreenshot) {
      alert("Please upload a payment screenshot.");
      return;
    }
    
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Competition Registration Successful! Your ID is ${data.id}`);
        window.location.href = "/";
      } else {
        alert("Failed to submit registration.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while submitting.");
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();
        if (data.url) {
          setFormData({ ...formData, paymentScreenshot: data.url });
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload screenshot.");
      }
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();
        if (data.url) {
          setFormData({ ...formData, profilePhotoUrl: data.url });
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload profile photo.");
      }
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={() => window.history.back()} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'rgba(255, 255, 255, 0.1)', 
            color: 'var(--text-main)', 
            border: 'none',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
          title="Go Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', paddingRight: '56px' }}>Competition Registration</h1>
      </div>
      
      {isLocked ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 style={{ color: 'var(--danger-color, red)', marginBottom: '1rem' }}>Form Locked</h2>
          <p style={{ color: 'var(--text-muted)' }}>This form has not started yet or is currently closed. Please check back later.</p>
        </div>
      ) : (
      <div className="card">
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Step 1: Athlete Details</h3>
            
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Student Name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onBlur={async () => {
                    if (formData.name.length > 2) {
                      try {
                        const res = await fetch(`/api/students/search?q=${encodeURIComponent(formData.name)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                          const student = data[0];
                          setFormData(prev => ({
                            ...prev,
                            branch: student.branch?.name || prev.branch,
                            belt: student.currentBelt || prev.belt,
                            age: student.age ? String(student.age) : prev.age
                          }));
                        }
                      } catch (err) {}
                    }
                  }}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Select Branch</label>
                <select 
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  required
                >
                  <option value="">-- Choose Preferred Branch --</option>
                  {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>Belt</label>
                <select 
                  value={formData.belt}
                  onChange={(e) => setFormData({...formData, belt: e.target.value})}
                  required
                >
                  <option value="">-- Select Belt --</option>
                  {belts.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  placeholder="Enter Age" 
                  min="4"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="form-group">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 45.5" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150" 
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Coach Name</label>
              <input 
                type="text" 
                placeholder="Enter Coach Name" 
                value={formData.coachName}
                onChange={(e) => setFormData({...formData, coachName: e.target.value})}
                required 
              />
            </div>

            <div className="form-group">
              <label>Profile Photo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleProfilePhotoUpload}
              />
              {formData.profilePhotoUrl && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', padding: '0.5rem', display: 'inline-block', borderRadius: '4px' }}>
                  <img src={formData.profilePhotoUrl} alt="Profile Photo Preview" style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Competition Fees</label>
              <input type="text" value={`₹ ${fee}`} disabled style={{ color: 'var(--text-muted)' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Proceed to Payment
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Step 2: Payment Verification</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Scan the QR Code below to pay the competition fees (₹ {fee}) via UPI.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ border: '4px solid var(--primary)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                <img src={qrCodeUrl} alt="Payment QR Code" style={{ width: '250px', height: '250px', objectFit: 'cover' }} />
              </div>
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Transaction ID / UTR Number</label>
              <input 
                type="text" 
                placeholder="e.g., 123456789012" 
                value={formData.transactionId}
                onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                required 
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <label>Payment Screenshot</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleScreenshotUpload}
                required
              />
              {formData.paymentScreenshot && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', padding: '0.5rem', display: 'inline-block', borderRadius: '4px' }}>
                  <img src={formData.paymentScreenshot} alt="Payment Screenshot Preview" style={{ height: '80px', objectFit: 'contain' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                Submit Registration
              </button>
            </div>
          </form>
        )}
      </div>
      )}
    </div>
  );
}
