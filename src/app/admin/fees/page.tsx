"use client";

import { useState, useEffect } from 'react';

export default function AdminFees() {
  const [data, setData] = useState<any>({ records: [], students: [], settings: {} });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [manualPayModal, setManualPayModal] = useState<any>(null);
  const [manualMethod, setManualMethod] = useState('CASH');
  const [manualNote, setManualNote] = useState('');

  const [waiveModal, setWaiveModal] = useState<any>(null);
  const [waiveReason, setWaiveReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFees();
  }, [statusFilter, monthFilter]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const url = `/api/fee?status=${statusFilter}&month=${monthFilter}`;
      const res = await fetch(url);
      const resData = await res.json();
      if (resData.records) {
        setData(resData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayModal) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/fee/manual-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: manualPayModal.studentId,
          month: manualPayModal.month,
          year: manualPayModal.year,
          paymentMethod: manualMethod,
          note: manualNote
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setManualPayModal(null);
        setManualNote('');
        fetchFees();
      } else {
        alert(result.error || "Failed to process manual payment");
      }
    } catch (e) {
      alert("Error processing manual payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaiveLateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveModal) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/fee/waive-late-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: waiveModal.studentId,
          month: waiveModal.month,
          year: waiveModal.year,
          waiverReason: waiveReason
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setWaiveModal(null);
        setWaiveReason('');
        fetchFees();
      } else {
        alert(result.error || "Failed to waive late fee");
      }
    } catch (e) {
      alert("Error waiving late fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyFee = async (record: any) => {
    if (!confirm(`Verify fee payment of ₹${record.totalAmount} for ${record.studentName} (${record.month} ${record.year})?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/fee/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feePaymentId: record.id?.startsWith('virtual_') ? null : record.id,
          studentId: record.studentId,
          month: record.month,
          year: record.year,
          paymentReference: record.paymentReference,
          adminName: 'Admin'
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message || "Fee payment verified successfully!");

        // Open WhatsApp Receipt
        const rawPhone = String(result.whatsappNumber || record.whatsappNumber || '').replace(/[^0-9]/g, '');
        if (rawPhone) {
          const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
          const msg = `🥋 *Champions Karate Club — Fee Payment Receipt*\n\nDear Parent / Student,\nYour monthly fee payment has been successfully *VERIFIED*! ✅\n\n👤 *Student Name:* ${result.studentName || record.studentName}\n🆔 *Reg No:* ${result.registrationNumber || record.registrationNumber || 'N/A'}\n📅 *Month / Year:* ${result.month || record.month} ${result.year || record.year}\n💰 *Amount Paid:* ₹${result.amount || record.totalAmount}\n🔢 *UTR No:* ${result.utr || record.utr || 'Direct UPI'}\n\nThank you for training with Champions Karate Club! 🔥🥋`;
          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        } else {
          alert(`Fee verified! (No WhatsApp phone number found for ${record.studentName})`);
        }

        fetchFees();
      } else {
        alert(result.error || "Failed to verify fee payment");
      }
    } catch (e: any) {
      alert("Error verifying payment: " + (e?.message || "Please check connection."));
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Reg No', 'Branch', 'Month/Year', 'Base Fee', 'Late Fee', 'Total Payable', 'Status', 'Payment Method', 'Paid Date'];

    const rows = data.records.map((r: any) => [
      r.studentName,
      r.registrationNumber || '-',
      r.branchName || '-',
      `${r.month} ${r.year}`,
      r.baseAmount,
      r.lateFee,
      r.totalAmount,
      r.status,
      r.paymentMethod || '-',
      r.paidAt ? new Date(r.paidAt).toLocaleDateString() : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `karate_student_fees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = data.records?.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName?.toLowerCase().includes(q) ||
      r.registrationNumber?.toLowerCase().includes(q) ||
      r.branchName?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-primary" style={{ margin: 0 }}>Student Fee Management</h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Manage monthly karate fees, manual payments, and late fee waivers
          </p>
        </div>
        <button className="btn btn-outline" onClick={exportToCSV}>📥 Export CSV</button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: '#111827', color: 'white', border: '1px solid #374151', padding: '0.5rem 0.8rem', borderRadius: '6px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="AWAITING_CONFIRMATION">⏳ Awaiting Verification Only</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="UNPAID">Unpaid / Overdue</option>
              <option value="PAID">Paid Only</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Filter Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ background: '#111827', color: 'white', border: '1px solid #374151', padding: '0.5rem 0.8rem', borderRadius: '6px' }}
            >
              <option value="ALL">All Months</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: '1 1 250px', maxWidth: '350px' }}>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Search Student</label>
          <input
            type="text"
            placeholder="Search student or reg no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: '#111827', color: 'white', border: '1px solid #374151', padding: '0.5rem 0.8rem', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* Fee Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading fee records...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: '#111827', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Student Details</th>
                <th style={{ padding: '1rem' }}>Fee Month</th>
                <th style={{ padding: '1rem' }}>Monthly Base Fee</th>
                <th style={{ padding: '1rem' }}>Late Fee (After 10th)</th>
                <th style={{ padding: '1rem' }}>Total Payable</th>
                <th style={{ padding: '1rem' }}>Status / Source</th>
                <th style={{ padding: '1rem' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r: any, idx: number) => {
                const isPaid = r.status === 'PAID' || r.status === 'Verified';
                const isAwaiting = !isPaid && (r.status === 'AWAITING_CONFIRMATION' || r.status === 'PAYMENT_PENDING' || !!r.utr);
                const isOverdue = !isPaid && !isAwaiting && r.status === 'OVERDUE';

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: isAwaiting ? 'rgba(251, 191, 36, 0.05)' : undefined }}>
                    <td data-label="Student" style={{ padding: '1rem' }}>
                      <strong style={{ color: 'white' }}>{r.studentName}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {r.registrationNumber} • {r.branchName}
                      </div>
                      {r.whatsappNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                          📱 {r.whatsappNumber}
                        </div>
                      )}
                    </td>

                    <td data-label="Month" style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {r.month} {r.year}
                    </td>

                    <td data-label="Base Fee" style={{ padding: '1rem' }}>
                      ₹{r.baseAmount}
                    </td>

                    <td data-label="Late Fee" style={{ padding: '1rem', color: r.lateFee > 0 ? '#ef4444' : '#94a3b8' }}>
                      {r.lateFee > 0 ? `+₹${r.lateFee}` : '₹0'}
                      {Boolean(r.lateFeeWaived) && <span style={{ display: 'block', fontSize: '0.75rem', color: '#60a5fa' }}>(Waived)</span>}
                    </td>

                    <td data-label="Total" style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.05rem', color: isPaid ? '#4ade80' : isAwaiting ? '#fbbf24' : isOverdue ? '#ef4444' : 'white' }}>
                      ₹{r.totalAmount}
                    </td>

                    <td data-label="Status" style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: isPaid 
                            ? 'rgba(74,222,128,0.15)' 
                            : isAwaiting 
                            ? 'rgba(251,191,36,0.2)' 
                            : isOverdue 
                            ? 'rgba(239,68,68,0.2)' 
                            : 'rgba(96,165,250,0.15)',
                          color: isPaid ? '#4ade80' : isAwaiting ? '#fbbf24' : isOverdue ? '#ef4444' : '#60a5fa',
                          border: isAwaiting ? '1px solid #fbbf24' : undefined
                        }}
                      >
                        {isAwaiting ? '⏳ Awaiting Verification' : r.status}
                      </span>

                      {/* Display UTR if submitted */}
                      {r.utr && (
                        <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '0.35rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          UTR: {r.utr}
                        </div>
                      )}

                      {r.paymentMethod && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          {r.paymentMethod}
                        </div>
                      )}
                    </td>

                    <td data-label="Actions" style={{ padding: '1rem' }}>
                      {isAwaiting ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 'bold', background: '#22c55e', borderColor: '#22c55e' }}
                            disabled={submitting}
                            onClick={() => handleVerifyFee(r)}
                          >
                            ✓ Verify & Send WhatsApp
                          </button>

                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem' }}
                            disabled={submitting}
                            onClick={() => setManualPayModal(r)}
                          >
                            Mark Paid
                          </button>
                        </div>
                      ) : !isPaid ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => setManualPayModal(r)}
                          >
                            Mark Paid Manually
                          </button>

                          {isOverdue && !r.lateFeeWaived && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: '#60a5fa', color: '#60a5fa' }}
                              onClick={() => setWaiveModal(r)}
                            >
                              Waive Late Fee
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            ✓ Paid
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: '#22c55e', color: '#4ade80' }}
                            onClick={() => {
                              const rawPhone = String(r.whatsappNumber || '').replace(/[^0-9]/g, '');
                              const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                              const msg = `🥋 *Champions Karate Club — Fee Payment Receipt*\n\nDear Parent / Student,\nYour monthly fee payment is confirmed *PAID*! ✅\n\n👤 *Student Name:* ${r.studentName}\n🆔 *Reg No:* ${r.registrationNumber || 'N/A'}\n📅 *Month / Year:* ${r.month} ${r.year}\n💰 *Amount:* ₹${r.totalAmount}\n🔢 *UTR No:* ${r.utr || 'Direct UPI'}\n\nThank you for training with Champions Karate Club! 🔥🥋`;
                              if (phone) {
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                              } else {
                                alert("No phone number found for this student.");
                              }
                            }}
                          >
                            📲 Send WhatsApp
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No matching fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Payment Modal */}
      {manualPayModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '2rem', borderRadius: '16px', background: '#1e293b' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Mark Fee Paid Manually</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Student: <strong>{manualPayModal.studentName}</strong><br />
              Month: <strong>{manualPayModal.month} {manualPayModal.year}</strong><br />
              Amount: <strong style={{ color: '#4ade80' }}>₹{manualPayModal.totalAmount}</strong>
            </p>

            <form onSubmit={handleManualPay}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#cbd5e1' }}>Payment Method</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI_OFFLINE">UPI (Offline Collect)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#cbd5e1' }}>Optional Admin Note</label>
                <input
                  type="text"
                  placeholder="e.g. Received cash at dojo"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setManualPayModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Confirm Manual Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Late Fee Modal */}
      {waiveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '2rem', borderRadius: '16px', background: '#1e293b' }}>
            <h3 style={{ color: '#60a5fa', marginTop: 0 }}>Waive Late Fee</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Waive ₹100 late fee for <strong>{waiveModal.studentName}</strong> ({waiveModal.month} {waiveModal.year}).
            </p>

            <form onSubmit={handleWaiveLateFee}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#cbd5e1' }}>Reason for Waiver</label>
                <input
                  type="text"
                  placeholder="e.g. Special permission by Sensei"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setWaiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: '#60a5fa', borderColor: '#60a5fa' }}>
                  {submitting ? 'Waiving...' : 'Confirm Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
