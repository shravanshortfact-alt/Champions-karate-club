"use client";

import { useState } from 'react';

interface UPIPaymentBlockProps {
  amount: string | number;
  qrCodeUrl?: string;
  upiId?: string;
  payeeName?: string;
  purpose?: string;
}

export default function UPIPaymentBlock({
  amount,
  qrCodeUrl = '/qr-700-card.png',
  upiId = 'shendredipak518-1@okhdfcbank',
  payeeName = 'Dipak Shendre',
  purpose = 'Karate Academy Fee'
}: UPIPaymentBlockProps) {
  const [copied, setCopied] = useState(false);

  const numAmount = parseFloat(String(amount || 0));
  const cleanAmount = numAmount > 0 ? numAmount.toFixed(2) : '700.00';
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(purpose);

  // Standard Universal UPI Intent URI
  const upiIntentUri = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${cleanAmount}&cu=INR&tn=${encodedNote}`;

  // App-specific intent deep-links
  const gpayUri = `intent://pay?pa=${upiId}&pn=${encodedName}&am=${cleanAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
  const phonepeUri = `intent://pay?pa=${upiId}&pn=${encodedName}&am=${cleanAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.phonepe.app;end`;
  const paytmUri = `paytmmp://pay?pa=${upiId}&pn=${encodedName}&am=${cleanAmount}&cu=INR&tn=${encodedNote}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenApp = (appUri: string, fallbackUri: string) => {
    // Attempt app launch on mobile
    window.location.href = appUri;
    setTimeout(() => {
      // Fallback to standard UPI chooser if app not directly opened
      window.location.href = fallbackUri;
    }, 500);
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #18181b 0%, #0f172a 100%)',
      border: '2px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
      textAlign: 'center',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      {/* Amount Header Banner */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Total Payable Amount
        </span>
        <div style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary)', lineHeight: '1.2' }}>
          ₹{numAmount > 0 ? numAmount : '700'}
        </div>
      </div>

      {/* MOBILE ONE-TAP DIRECT PAYMENT (No Screenshot Required!) */}
      <div style={{
        background: 'rgba(37, 99, 235, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '14px',
        padding: '1.2rem 1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          <span>⚡ Same Phone Payment (No Screenshot Needed!)</span>
        </div>

        {/* Big Universal Button */}
        <a
          href={upiIntentUri}
          className="btn btn-primary"
          style={{
            display: 'block',
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
            borderColor: '#2563eb',
            color: 'white',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)'
          }}
        >
          📱 OPEN IN UPI APP (GPay / PhonePe / Paytm / Any App)
        </a>

        {/* Quick App Shortcut Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => handleOpenApp(gpayUri, upiIntentUri)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f8fafc',
              padding: '0.6rem 0.4rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            Google Pay
          </button>
          <button
            type="button"
            onClick={() => handleOpenApp(phonepeUri, upiIntentUri)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#c084fc',
              padding: '0.6rem 0.4rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            PhonePe
          </button>
          <button
            type="button"
            onClick={() => handleOpenApp(paytmUri, upiIntentUri)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '0.6rem 0.4rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            Paytm
          </button>
        </div>
      </div>

      {/* Copy UPI ID Box */}
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Official UPI ID</span>
          <span style={{ color: '#4ade80', fontSize: '0.95rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {upiId}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? '#22c55e' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy UPI ID'}
        </button>
      </div>

      {/* QR Code Divider / Alternative for Desktop or 2nd Phone */}
      <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
        <div style={{ borderTop: '1px solid #334155', position: 'absolute', top: '50%', width: '100%', left: 0 }}></div>
        <span style={{ background: '#0f172a', padding: '0 1rem', position: 'relative', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          OR SCAN QR FROM ANOTHER PHONE
        </span>
      </div>

      {/* QR Code Display */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
        <div style={{
          border: '3px solid var(--primary)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'inline-block',
          background: 'white',
          padding: '0.5rem',
          boxShadow: '0 8px 25px rgba(220, 38, 38, 0.25)'
        }}>
          <img
            src={qrCodeUrl || '/qr-700-card.png'}
            alt="Payment QR Code"
            style={{ width: '230px', height: 'auto', display: 'block', borderRadius: '6px' }}
          />
        </div>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.5rem', marginBottom: 0 }}>
        Scan with any UPI app — Payee name <strong>Dipak Shendre</strong> will appear upon scanning.
      </p>
    </div>
  );
}
