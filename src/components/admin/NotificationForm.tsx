"use client";
import React, { useState, useEffect } from 'react';

export default function NotificationForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('General');
  const [priority, setPriority] = useState('Normal');
  const [targetAudience, setTargetAudience] = useState('All');
  const [specificStudentIds, setSpecificStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (targetAudience === 'Specific' && students.length === 0) {
      fetch('/api/students?status=Active')
        .then(res => res.json())
        .then((data: any) => setStudents(data))
        .catch(err => console.error("Error fetching students:", err));
    }
  }, [targetAudience, students.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          priority,
          targetAudience,
          specificStudentIds
        })
      });

      const data: any = await res.json();
      if (data.success) {
        setTitle('');
        setMessage('');
        setType('General');
        setPriority('Normal');
        setTargetAudience('All');
        setSpecificStudentIds([]);
        onSuccess();
      } else {
        setError(data.error || 'Failed to send notification');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (id: string) => {
    setSpecificStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
      
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem' }}
          placeholder="Notification Title"
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message</label>
        <textarea 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          required 
          rows={4}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem', resize: 'vertical' }}
          placeholder="Notification Message"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' }}
          >
            <option value="General">General</option>
            <option value="Fee Reminder">Fee Reminder</option>
            <option value="Event">Event</option>
            <option value="Competition">Competition</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priority</label>
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' }}
          >
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Target Audience</label>
        <select 
          value={targetAudience} 
          onChange={e => setTargetAudience(e.target.value)}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' }}
        >
          <option value="All">All Active Students</option>
          <option value="Specific">Specific Students</option>
        </select>
      </div>

      {targetAudience === 'Specific' && (
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Students</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px', padding: '0.5rem', background: '#f9fafb' }}>
            {students.length === 0 ? (
              <p style={{ margin: '0.5rem', color: '#666' }}>Loading students...</p>
            ) : (
              students.map(student => (
                <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem' }}>
                  <input 
                    type="checkbox" 
                    id={`student-${student.id}`}
                    checked={specificStudentIds.includes(student.id)}
                    onChange={() => handleStudentSelect(student.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`student-${student.id}`} style={{ cursor: 'pointer' }}>{student.name} ({student.registrationNumber})</label>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || (targetAudience === 'Specific' && specificStudentIds.length === 0)}
        style={{ 
          marginTop: '1rem',
          padding: '1rem', 
          background: 'var(--primary)', 
          color: 'black', 
          border: 'none', 
          borderRadius: '6px', 
          fontSize: '1.1rem', 
          fontWeight: 'bold', 
          cursor: (loading || (targetAudience === 'Specific' && specificStudentIds.length === 0)) ? 'not-allowed' : 'pointer',
          opacity: (loading || (targetAudience === 'Specific' && specificStudentIds.length === 0)) ? 0.7 : 1
        }}
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </button>
    </form>
  );
}
