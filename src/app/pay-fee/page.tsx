"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PayFee() {
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [feeData, setFeeData] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploadData = new FormData();
      uploadData.append('file', file);
      setUploadingScreenshot(true);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();
        if (data.url) {
          setScreenshotUrl(data.url);
        }
      } catch (error) {
        console.error("Upload failed", error);
        setError("Failed to upload screenshot.");
      } finally {
        setUploadingScreenshot(false);
      }
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/fee/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName })
      });
      const data = await res.json();
      
      if (res.ok) {
        setFeeData(data);
        setStep(2);
      } else {
        setError(data.error || 'Student not found.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId && !screenshotUrl) {
      setError('Please provide either a Transaction ID or a Screenshot URL.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/fee/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: feeData.student.id,
          month: feeData.feeDetails.month,
          year: feeData.feeDetails.year,
          baseAmount: feeData.feeDetails.baseAmount,
          lateFee: feeData.feeDetails.lateFee,
          totalAmount: feeData.feeDetails.totalAmount,
          transactionId,
          screenshotUrl
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to submit payment.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // UPI Link format for dynamic QR
  // Example: upi://pay?pa=paytm@upi&pn=ChampionKarateClub&am=800&cu=INR&tn=Fee+July+2026
  const getUpiLink = () => {
    if (!feeData) return '';
    const { totalAmount, month, year } = feeData.feeDetails;
    const upiId = feeData.upiId;
    return `upi://pay?pa=${upiId}&pn=Champion+Karate+Club&am=${totalAmount}&cu=INR&tn=Fee+${month}+${year}+${studentName.replace(/ /g, '+')}`;
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem', position: 'relative' }}>
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
            position: 'absolute',
            left: '0',
            top: '0'
          }}
          title="Go Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <h1 className="text-primary" style={{ marginBottom: '1rem', fontSize: '2.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(220, 38, 38, 0.3)' }}>Smart Fee Payment</h1>
          
          {!success && (
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Securely pay your monthly fees via Auto-Generated QR Code. Fast, easy, and reliable.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'center', borderColor: '#ef4444' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'center', borderColor: '#4ade80' }}>
          <h2 style={{ color: '#4ade80', marginBottom: '1rem' }}>Payment Submitted!</h2>
          <p>Your payment is currently <strong>Pending Verification</strong> by the admin. Once verified, it will reflect in your account.</p>
          <button className="btn btn-outline" style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>Pay for another student</button>
        </div>
      )}

      {!success && step === 1 && (
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto 3rem auto', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(30,30,30,0.8) 100%)' }}>
          <form onSubmit={handleLookup}>
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
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Searching...' : 'Find Details'}
            </button>
          </form>
        </div>
      )}

      {!success && step === 2 && feeData && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 3rem auto', padding: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'linear-gradient(90deg, #1f2937 0%, #111827 100%)', padding: '2rem', borderBottom: '2px solid var(--primary)' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.4rem' }}>Student Details</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#d1d5db' }}>
              <div style={{ flex: '1 1 45%' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Name</span>
                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{feeData.student.name}</strong>
              </div>
              <div style={{ flex: '1 1 45%' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Branch</span>
                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{feeData.student.branch}</strong>
              </div>
              <div style={{ flex: '1 1 100%' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Fee For</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{feeData.feeDetails.month} {feeData.feeDetails.year}</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'var(--bg-card)' }}>

          <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Fee Breakdown</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Monthly Base Fee:</span>
              <span>₹{feeData.feeDetails.baseAmount}</span>
            </div>
            {feeData.feeDetails.lateFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#ef4444' }}>
                <span>Late Fee (After 10th):</span>
                <span>+ ₹{feeData.feeDetails.lateFee}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total Payable Amount:</span>
              <span className="text-primary">₹{feeData.feeDetails.totalAmount}</span>
            </div>
          </div>

          <div style={{ padding: '2rem', background: '#111827', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'white', fontSize: '1.4rem' }}>Scan to Pay</h3>
            <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '16px', boxShadow: '0 10px 25px rgba(220,38,38,0.2)' }}>
              <QRCodeSVG value={getUpiLink()} size={220} />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Scan with GPay, PhonePe, Paytm, or any UPI app</p>
          </div>

          <div style={{ padding: '2rem', background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Confirm Payment</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{ color: '#9ca3af' }}>Transaction ID (UTR No.)</label>
                <input 
                  type="text" 
                  placeholder="Enter 12-digit UTR number" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{ background: '#1f2937', border: '1px solid #374151', color: 'white' }}
                />
              </div>
              <p style={{ textAlign: 'center', margin: '1.5rem 0', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '2px' }}>— OR —</p>
              <div className="form-group" style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #4b5563' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: 'white', textAlign: 'center' }}>Upload Payment Screenshot</label>
                
                {!screenshotUrl ? (
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
                    <button type="button" className="btn btn-outline" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', borderWidth: '2px', background: 'rgba(255,255,255,0.02)' }} disabled={uploadingScreenshot}>
                      {uploadingScreenshot ? 'Uploading...' : 'Choose Image (JPG, PNG)'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      disabled={uploadingScreenshot}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <img src={screenshotUrl} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '1rem', border: '2px solid var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
                    <button type="button" className="btn btn-outline" onClick={() => setScreenshotUrl('')} style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>Remove Image</button>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {loading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
