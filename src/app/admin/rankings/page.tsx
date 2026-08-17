"use client";

import { useState, useEffect } from 'react';


export default function AdminRankings() {
  const [events, setEvents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Add Event Form State
  const [eventName, setEventName] = useState('');
  const [goldPoints, setGoldPoints] = useState(3);
  const [silverPoints, setSilverPoints] = useState(2);
  const [bronzePoints, setBronzePoints] = useState(1);

  // Award Medal Form State
  const [studentId, setStudentId] = useState('');
  const [eventId, setEventId] = useState('');
  const [level, setLevel] = useState('District');
  const [medal, setMedal] = useState('Gold');

  const fetchData = async () => {
    try {
      const resEvents = await fetch('/api/events');
      setEvents(await resEvents.json());

      const resStudents = await fetch('/api/students?status=Active');
      setStudents(await resStudents.json());

      const resAch = await fetch('/api/achievements');
      setAchievements(await resAch.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName, goldPoints, silverPoints, bronzePoints })
      });
      if (res.ok) {
        setEventName('');
        alert("Event added successfully");
        fetchData();
      }
    } catch (e) {
      alert("Error adding event");
    }
  };

  const handleAwardMedal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !eventId) {
      alert("Please select both student and event.");
      return;
    }
    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, eventId, level, medal })
      });
      if (res.ok) {
        alert("Medal awarded successfully! Points updated.");
        fetchData();
      } else {
        alert("Error awarding medal");
      }
    } catch (e) {
      alert("Error awarding medal");
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Rankings & Medals Management</h1>
      
      <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Event Management */}
        <div className="card">
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Create New Event / Sport</h2>
          <form onSubmit={handleAddEvent}>
            <div className="form-group">
              <label>Event Name</label>
              <input type="text" placeholder="e.g. Kata Competition" value={eventName} onChange={e => setEventName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>Rank 1 Points (Gold)</label>
                <input type="number" value={goldPoints} onChange={e => setGoldPoints(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Rank 2 Points (Silver)</label>
                <input type="number" value={silverPoints} onChange={e => setSilverPoints(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Rank 3 Points (Bronze)</label>
                <input type="number" value={bronzePoints} onChange={e => setBronzePoints(parseInt(e.target.value))} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Event</button>
          </form>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Existing Events</h3>
          <ul style={{ listStyle: 'none' }}>
            {events.map((ev, i) => (
              <li key={i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <strong>{ev.name}</strong> (G: {ev.goldPoints}, S: {ev.silverPoints}, B: {ev.bronzePoints})
              </li>
            ))}
            {events.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No events created yet.</li>}
          </ul>
        </div>

        {/* Award Medals */}
        <div className="card">
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Award Medal to Student</h2>
          <form onSubmit={handleAwardMedal}>
            <div className="form-group">
              <label>Select Student</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
                <option value="">-- Choose Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Select Event</label>
              <select value={eventId} onChange={e => setEventId(e.target.value)} required>
                <option value="">-- Choose Event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} required>
                  <option value="Class">Class</option>
                  <option value="District">District</option>
                  <option value="State">State</option>
                  <option value="National">National</option>
                  <option value="International">International</option>
                </select>
              </div>
              <div className="form-group">
                <label>Medal (Rank)</label>
                <select value={medal} onChange={e => setMedal(e.target.value)} required>
                  <option value="Gold">Rank 1 (Gold)</option>
                  <option value="Silver">Rank 2 (Silver)</option>
                  <option value="Bronze">Rank 3 (Bronze)</option>
                  <option value="Participation">Participation</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>Award Medal</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Pending Medal Claims</h2>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.8rem' }}>Date</th>
              <th style={{ padding: '0.8rem' }}>Student</th>
              <th style={{ padding: '0.8rem' }}>Event</th>
              <th style={{ padding: '0.8rem' }}>Level</th>
              <th style={{ padding: '0.8rem' }}>Medal</th>
              <th style={{ padding: '0.8rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {achievements.filter(a => a.status === 'Pending').map((ach, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.8rem' }}>{new Date(ach.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '0.8rem' }}>{ach.student?.name}</td>
                <td style={{ padding: '0.8rem' }}>{ach.event?.name}</td>
                <td style={{ padding: '0.8rem' }}>{ach.level}</td>
                <td style={{ padding: '0.8rem' }}>{ach.medal}</td>
                <td style={{ padding: '0.8rem' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                    onClick={async () => {
                      const res = await fetch('/api/student/achievements', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: ach.id, status: 'Approved' })
                      });
                      if(res.ok) fetchData();
                    }}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={async () => {
                      if(confirm("Reject this claim?")) {
                         const res = await fetch('/api/student/achievements', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: ach.id, status: 'Rejected' })
                          });
                          if(res.ok) fetchData();
                      }
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {achievements.filter(a => a.status === 'Pending').length === 0 && (
              <tr><td colSpan={6} style={{ padding: '1rem', color: 'var(--text-muted)' }}>No pending claims.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Recent Achievements</h2>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Event</th>
              <th style={{ padding: '1rem' }}>Level</th>
              <th style={{ padding: '1rem' }}>Medal</th>
              <th style={{ padding: '1rem' }}>Points</th>
              <th style={{ padding: '1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((ach, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{ach.student?.name}</td>
                <td style={{ padding: '1rem' }}>{ach.event?.name}</td>
                <td style={{ padding: '1rem' }}>{ach.level}</td>
                <td style={{ padding: '1rem', color: ach.medal === 'Gold' ? 'gold' : ach.medal === 'Silver' ? 'silver' : '#cd7f32' }}>
                  {ach.medal === 'Gold' ? 'Rank 1 (Gold)' : ach.medal === 'Silver' ? 'Rank 2 (Silver)' : ach.medal === 'Bronze' ? 'Rank 3 (Bronze)' : ach.medal}
                </td>
                <td style={{ padding: '1rem' }}>+{ach.pointsEarned}</td>
                <td style={{ padding: '1rem' }}>{new Date(ach.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {achievements.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No achievements recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
