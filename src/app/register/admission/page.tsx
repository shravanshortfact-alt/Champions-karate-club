"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AdmissionForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    whatsappNumber: '',
    branch: '',
    category: 'Admission',
    transactionId: '',
    paymentScreenshot: '',
    profilePhotoUrl: ''
  });
  
  const [branches, setBranches] = useState<{name: string, fee?: string, qrCodeUrl: string}[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('/qr.png');
  const [fee, setFee] = useState('2500');
  const [baseFee, setBaseFee] = useState('2500');
  const [customQr, setCustomQr] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        const linkConfig = data.registrationLinks?.find((l: any) => l.link === '/register/admission');
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
    
    if (selectedBranch && selectedBranch.fee) {
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
    if (formData.name && formData.age && formData.branch && formData.dob && formData.whatsappNumber) {
      if (formData.whatsappNumber.length !== 10) {
        alert("WhatsApp number must be exactly 10 digits.");
        return;
      }

      const enteredAge = parseInt(formData.age);
      const birthYear = new Date(formData.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;

      if (Math.abs(enteredAge - calculatedAge) > 2) {
        alert(`The entered age (${enteredAge}) does not match the Date of Birth (${formData.dob}). Please check your inputs.`);
        return;
      }

      setStep(2);
    } else {
      alert("Please fill all details.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transactionId || formData.transactionId.length !== 12) {
      alert("Please enter a valid 12-digit UTR Number.");
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
        alert(`Payment Successful! Registration submitted. Please wait for admin approval.`);
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
        <h1 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', paddingRight: '56px' }}>Academy Admission</h1>
      </div>
      
      <div className="card">
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Step 1: Student Details</h3>
            
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

            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Enter Student Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>

            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                placeholder="Enter Age" 
                min="3"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required 
              />
            </div>

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
              <label>Parent's WhatsApp Number</label>
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                value={formData.whatsappNumber}
                maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, whatsappNumber: val});
                }}
                style={{ 
                  borderColor: formData.whatsappNumber && formData.whatsappNumber.length < 10 ? '#ef4444' : 'var(--border-color)',
                  outlineColor: formData.whatsappNumber && formData.whatsappNumber.length < 10 ? '#ef4444' : ''
                }}
                required 
              />
              {formData.whatsappNumber && formData.whatsappNumber.length < 10 && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Number must be exactly 10 digits</span>
              )}
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
              <label>Admission Fees</label>
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
              Scan the QR Code below to pay the admission fees (₹ {fee}) via UPI. Registration is complete only after successful payment.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ border: '4px solid var(--primary)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                <img src={qrCodeUrl} alt="Payment QR Code" style={{ width: '250px', height: '250px', objectFit: 'cover' }} />
              </div>
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>UTR Number</label>
              <input 
                type="text" 
                placeholder="e.g., 123456789012" 
                value={formData.transactionId}
                maxLength={12}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, transactionId: val});
                }}
                style={{ 
                  borderColor: formData.transactionId && formData.transactionId.length !== 12 ? '#ef4444' : 'var(--border-color)',
                  outlineColor: formData.transactionId && formData.transactionId.length !== 12 ? '#ef4444' : ''
                }}
                required 
              />
              {formData.transactionId && formData.transactionId.length !== 12 && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>UTR number must be exactly 12 digits</span>
              )}
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
    </div>
  );
}
