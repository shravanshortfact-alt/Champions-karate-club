"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PayFee() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState<any>(null);

  // Selection state for multi-month payment
  const [selectedMonthKeys, setSelectedMonthKeys] = useState<string[]>([]);

  // Direct UPI Payment Attempt State
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);
  const [paymentAttempt, setPaymentAttempt] = useState<any>(null);

  // UTR Submission State
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingPaid, setIsSubmittingPaid] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = (upi: string) => {
    if (!upi) return;
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setStudentData(null);
    setSelectedMonthKeys([]);
    setPaymentAttempt(null);
    setConfirmationNotice(null);

    try {
      const res = await fetch('/api/fee/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: searchQuery.trim(),
          registrationNumber: searchQuery.trim()
        })
      });
      const data: any = await res.json();

      if (res.ok && data.success) {
        setStudentData(data);
        // Pre-select all unpaid / overdue months by default
        const pendingKeys = data.timeline
          .filter((m: any) => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING' || m.status === 'PAYMENT_CREATED' || m.status === 'AWAITING_CONFIRMATION')
          .map((m: any) => `${m.month}_${m.year}`);
        setSelectedMonthKeys(pendingKeys);
      } else {
        setError(data.error || 'Active student record not found.');
      }
    } catch (err) {
      setError('An error occurred while fetching fee details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonthSelection = (key: string) => {
    if (selectedMonthKeys.includes(key)) {
      setSelectedMonthKeys(selectedMonthKeys.filter((k) => k !== key));
    } else {
      setSelectedMonthKeys([...selectedMonthKeys, key]);
    }
  };

  // Compute total payable for currently checked months
  const selectedMonthsList = studentData?.timeline?.filter((m: any) =>
    selectedMonthKeys.includes(`${m.month}_${m.year}`)
  ) || [];

  const totalPayableAmount = selectedMonthsList.reduce((acc: number, m: any) => acc + m.totalAmount, 0);

  // Initiate Direct Teacher UPI Payment Attempt
  const handleInitiateDirectUPI = async () => {
    if (selectedMonthsList.length === 0) {
      alert("Please select at least one unpaid month to pay.");
      return;
    }

    setIsCreatingAttempt(true);
    setError('');

    try {
      const res = await fetch('/api/fee/direct-upi/create-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentData.student.id,
          selectedMonths: selectedMonthsList.map((m: any) => ({
            month: m.month,
            year: m.year
          }))
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentAttempt(data);
      } else {
        throw new Error(data.error || "Failed to generate UPI payment request.");
      }
    } catch (err: any) {
      console.error("Direct UPI Creation Error:", err);
      setError(err.message || "Failed to initiate UPI payment.");
    } finally {
      setIsCreatingAttempt(false);
    }
  };

  // Student clicks "I HAVE PAID"
  const handleSubmitPaid = async () => {
    if (!paymentAttempt) return;

    setIsSubmittingPaid(true);
    setError('');

    try {
      const res = await fetch('/api/fee/direct-upi/submit-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentAttempt.paymentReference,
          utr: utrInput.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmationNotice(data);
        setPaymentAttempt(null);
        // Refresh timeline
        await handleLookup();
      } else {
        setError(data.error || "Failed to submit payment confirmation.");
      }
    } catch (e) {
      setError("An error occurred while submitting payment confirmation.");
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.5rem', minHeight: '85vh', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Page Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="text-primary" style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Monthly Student Fees
        </h1>
        <p className="text-muted" style={{ fontSize: '1.05rem', margin: '0 auto' }}>
          Champions Karate Club — Direct Teacher UPI Payment System
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', textAlign: 'center', padding: '1rem' }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      {/* Confirmation Notice Screen (Awaiting Confirmation) */}
      {confirmationNotice && (
        <div className="card animate-fade-in" style={{ marginBottom: '3rem', padding: '2rem', border: '2px solid #fbbf24', background: '#0f172a', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
          <h2 style={{ color: '#fbbf24', margin: '0 0 0.5rem 0', fontSize: '1.6rem' }}>Payment Submitted for Verification</h2>
          <p style={{ color: '#e2e8f0', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            Thank you, <strong>{confirmationNotice.studentName}</strong>! Your payment of <strong>₹{confirmationNotice.amount}</strong> has been submitted.
          </p>

          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#94a3b8' }}>Payment Reference: </strong><span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{confirmationNotice.paymentReference}</span></div>
            <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#94a3b8' }}>Teacher / Sensei: </strong><span style={{ color: 'white' }}>{confirmationNotice.teacherName}</span></div>
            <div><strong style={{ color: '#94a3b8' }}>Status: </strong><span style={{ color: '#fbbf24', fontWeight: 'bold' }}>AWAITING CONFIRMATION</span></div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
            Please allow your branch teacher ({confirmationNotice.teacherName}) to verify the transaction in their teacher portal. Once verified, your status will update to PAID.
          </p>

          <button className="btn btn-outline" onClick={() => setConfirmationNotice(null)} style={{ width: '100%', maxWidth: '300px' }}>
            Back to Fee Status
          </button>
        </div>
      )}

      {/* Step 1: Student Search Form */}
      <div className="card" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2.5rem', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(30,30,30,0.9) 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <form onSubmit={handleLookup}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '1rem', color: '#d1d5db', marginBottom: '0.5rem', display: 'block' }}>Search Student (Name or Registration No.)</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma or REG-101"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.9rem 1.2rem', fontSize: '1.05rem', borderRadius: '8px', background: '#111827', border: '1px solid #374151', color: 'white' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 'bold' }}>
            {loading ? 'Searching Record...' : '🔍 Find Fee Details'}
          </button>
        </form>
      </div>

      {/* Step 2: Student Profile & Fee Timeline */}
      {studentData && !paymentAttempt && (
        <div className="animate-fade-in">
          {/* Student Profile Card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', background: '#111827', border: '1px solid var(--primary)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Profile</span>
              <h2 style={{ color: 'white', margin: '0.2rem 0', fontSize: '1.6rem' }}>{studentData.student.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.4rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <span>🥋 Belt: <strong>{studentData.student.currentBelt}</strong></span>
                <span>📍 Branch: <strong>{studentData.student.branch}</strong></span>
                <span>🆔 Reg: <strong>{studentData.student.registrationNumber}</strong></span>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Base Fee</span>
              <h3 style={{ color: '#ef4444', margin: 0, fontSize: '1.5rem' }}>₹{studentData.student.monthlyFee} / mo</h3>
            </div>
          </div>

          {/* Fee Month Breakdown List */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.3rem' }}>Monthly Fee Breakdown</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {studentData.timeline?.map((m: any) => {
                const monthKey = `${m.month}_${m.year}`;
                const isChecked = selectedMonthKeys.includes(monthKey);
                const isPaid = m.status === 'PAID';
                const isOverdue = m.status === 'OVERDUE';
                const isAwaiting = m.status === 'AWAITING_CONFIRMATION' || m.status === 'PAYMENT_CREATED';

                return (
                  <div
                    key={monthKey}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      background: isPaid ? '#0f172a' : isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
                      border: isPaid
                        ? '1px solid #334155'
                        : isOverdue
                        ? '1px solid #ef4444'
                        : '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {!isPaid && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMonthSelection(monthKey)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                      )}

                      <div>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '1.15rem' }}>
                          {m.month} {m.year}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          Base Fee: ₹{m.baseAmount}
                          {m.lateFee > 0 && (
                            <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                              + ₹{m.lateFee} Late Fee (After 10th)
                            </span>
                          )}
                          {m.lateFeeWaived && (
                            <span style={{ color: '#60a5fa', marginLeft: '0.5rem' }}>
                              (Late Fee Waived)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isPaid ? '#4ade80' : isOverdue ? '#ef4444' : 'var(--primary)' }}>
                          ₹{m.totalAmount}
                        </div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                          Total Payable
                        </span>
                      </div>

                      <span
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          background: isPaid
                            ? 'rgba(74, 222, 128, 0.15)'
                            : isOverdue
                            ? 'rgba(239, 68, 68, 0.2)'
                            : isAwaiting
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(96, 165, 250, 0.15)',
                          color: isPaid
                            ? '#4ade80'
                            : isOverdue
                            ? '#ef4444'
                            : isAwaiting
                            ? '#fbbf24'
                            : '#60a5fa',
                          border: isPaid
                            ? '1px solid #4ade80'
                            : isOverdue
                            ? '1px solid #ef4444'
                            : isAwaiting
                            ? '1px solid #fbbf24'
                            : '1px solid #60a5fa'
                        }}
                      >
                        {isPaid ? '✓ Paid' : isOverdue ? 'Overdue' : isAwaiting ? 'Awaiting Confirm' : 'Due'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Initiation Card */}
          {studentData.summary.totalPendingMonths > 0 ? (
            <div className="card" style={{ padding: '1.75rem', borderRadius: '16px', background: '#111827', border: '2px solid var(--primary)', boxShadow: '0 15px 35px rgba(220,38,38,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Selected ({selectedMonthsList.length}) Month(s)</h3>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Direct Teacher UPI Payment</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Total Amount</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{totalPayableAmount}</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleInitiateDirectUPI}
                disabled={isCreatingAttempt || selectedMonthsList.length === 0}
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  borderRadius: '10px'
                }}
              >
                {isCreatingAttempt ? 'Generating UPI Request...' : `PAY ₹${totalPayableAmount} VIA UPI`}
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', borderColor: '#4ade80', background: 'rgba(74, 222, 128, 0.05)' }}>
              <h3 style={{ color: '#4ade80', margin: 0 }}>🎉 All Monthly Fees Up To Date!</h3>
              <p style={{ color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>No pending or overdue fees for this student.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: DYNAMIC UPI QR PAYMENT SCREEN */}
      {paymentAttempt && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.5rem', borderRadius: '16px', background: '#0f172a', border: '2px solid var(--primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxWidth: '580px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Direct UPI Fee Payment</span>
            <h2 style={{ color: 'white', margin: '0.25rem 0', fontSize: '1.6rem' }}>Scan QR or Open UPI App</h2>
            <p style={{ color: '#60a5fa', margin: 0, fontSize: '0.9rem' }}>Reference: <strong>{paymentAttempt.paymentReference}</strong></p>
          </div>

          {/* Amount Badge Banner */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '0.75rem 1.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                {paymentAttempt.amount === 800 
                  ? '⚠️ Monthly Fee + Late Fee (After 10th)' 
                  : paymentAttempt.amount === 700 
                  ? '✓ Regular Monthly Fee (₹700)' 
                  : 'Total Payable Amount'}
              </span>
              <span style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.2' }}>
                ₹{paymentAttempt.amount}
              </span>
            </div>
          </div>

          {/* Clean Dynamic QR Code Container */}
          <div style={{ textAlign: 'center', background: '#111827', padding: '1.5rem 1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #374151', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'white', padding: '0.75rem', display: 'inline-block', borderRadius: '14px', boxShadow: '0 10px 25px rgba(220,38,38,0.2)' }}>
              {paymentAttempt.amount === 700 ? (
                <img 
                  src="/qr-700-card.png" 
                  alt="Fees Payment QR ₹700" 
                  style={{ width: '250px', height: 'auto', display: 'block', borderRadius: '8px' }} 
                />
              ) : paymentAttempt.amount === 800 ? (
                <img 
                  src="/qr-800-card.png" 
                  alt="Fees Payment QR ₹800" 
                  style={{ width: '250px', height: 'auto', display: 'block', borderRadius: '8px' }} 
                />
              ) : (
                <div style={{ padding: '0.75rem' }}>
                  <QRCodeSVG value={paymentAttempt.upiUri} size={230} />
                </div>
              )}
            </div>

            {/* UPI ID with Copy Button */}
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPI ID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {paymentAttempt.teacher?.upiId || 'shendredipak518-1@okhdfcbank'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUpi(paymentAttempt.teacher?.upiId || 'shendredipak518-1@okhdfcbank')}
                  style={{
                    background: copiedUpi ? '#22c55e' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                  }}
                >
                  {copiedUpi ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <p style={{ marginTop: '0.9rem', fontSize: '0.82rem', color: '#94a3b8', margin: '0.9rem 0 0 0' }}>
              Scan to pay with GPay, PhonePe, Paytm, BHIM, or any UPI App
            </p>
          </div>

          {/* UPI Intent Deep Link Button for Mobile */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <a
              href={paymentAttempt.upiUri}
              className="btn btn-primary"
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                borderColor: '#2563eb'
              }}
            >
              📱 OPEN IN UPI APP (GPay / PhonePe / Paytm / BHIM)
            </a>
          </div>

          {/* Optional UTR Field & I HAVE PAID Confirmation */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #4b5563' }}>
            <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Step 2: Confirm After Payment</h3>
            
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>
                Optional: Enter UPI Transaction ID (UTR No.)
              </label>
              <input
                type="text"
                placeholder="12-digit UTR No. (optional)"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitPaid}
              disabled={isSubmittingPaid}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', background: '#22c55e', borderColor: '#22c55e' }}
            >
              {isSubmittingPaid ? 'Submitting...' : '✓ I HAVE PAID'}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPaymentAttempt(null)}
              style={{ width: '100%', marginTop: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
