"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const runtime = 'edge';


export default function RankingsPage() {
  const router = useRouter();
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filter, setFilter] = useState('Overall');
  const [showRules, setShowRules] = useState(false);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/students?status=Active')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setAllStudents(data);
        }
      });
  }, []);

  useEffect(() => {
    if (allStudents.length > 0) {
      const getPoints = (student: any) => {
        if (filter === 'Overall') return student.totalPoints || 0;
        
        const approvedAch = student.achievements?.filter((a: any) => a.status === 'Approved' || (!a.status && a.status !== 'Pending')) || [];
        
        let filtered = approvedAch;
        if (filter === 'Classroom') {
          filtered = approvedAch.filter((a: any) => a.level === 'Classroom' || a.level === 'Class' || a.level === 'District');
        } else if (filter === 'State') {
          filtered = approvedAch.filter((a: any) => a.level === 'State');
        } else if (filter === 'National') {
          filtered = approvedAch.filter((a: any) => a.level === 'National');
        } else if (filter === 'Competition') {
          filtered = approvedAch.filter((a: any) => a.event?.name?.toLowerCase().includes('comp'));
        } else if (filter === 'Belt Exam') {
          filtered = approvedAch.filter((a: any) => a.event?.name?.toLowerCase().includes('belt'));
        }
        
        return filtered.reduce((sum: number, a: any) => sum + (a.pointsEarned || 0), 0);
      };

      const sorted = [...allStudents].map(s => ({...s, currentFilterPoints: getPoints(s)}))
                                     .sort((a, b) => b.currentFilterPoints - a.currentFilterPoints);
      setStudents(sorted);
      setCurrentMobileIndex(0);
    }
  }, [allStudents, filter]);

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '80vh' }}>
      <div className="leaderboard-header" style={{ marginBottom: '1rem', textAlign: 'center', position: 'relative' }}>
        <button 
          onClick={() => router.back()} 
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
          title="Go Back"
        >
          &#8592;
        </button>
        <h1 className="text-primary" style={{ margin: 0, fontSize: '2.2rem', fontWeight: 'bold' }}>Student Leaderboard</h1>
      </div>

      <div className="hide-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: '0.8rem', paddingBottom: '1rem', marginBottom: '1.5rem', WebkitOverflowScrolling: 'touch', justifyContent: 'center' }}>
        {['Overall', 'Classroom', 'State', 'National', 'Competition'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: '25px', 
              background: filter === f ? 'var(--primary)' : '#222', 
              color: filter === f ? '#000' : '#d1d5db',
              border: filter === f ? 'none' : '1px solid #444',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filter === f ? '0 0 10px rgba(220, 38, 38, 0.4)' : 'none'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {students.length > 0 ? (
        <>
          {/* Leaderboard Carousel */}
          <div className="leaderboard-carousel" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div className="carousel-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '600px' }}>
              <button 
                onClick={() => setCurrentMobileIndex(prev => prev === 0 ? students.length - 1 : prev - 1)}
                style={{ position: 'absolute', left: -15, zIndex: 10, background: '#333', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
              >
                &#8249;
              </button>
              
              <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '2rem', textAlign: 'center', background: currentMobileIndex === 0 ? 'linear-gradient(145deg, rgba(255,215,0,0.2) 0%, #1a1a1a 100%)' : currentMobileIndex === 1 ? 'linear-gradient(145deg, rgba(192,192,192,0.2) 0%, #1a1a1a 100%)' : currentMobileIndex === 2 ? 'linear-gradient(145deg, rgba(205,127,50,0.2) 0%, #1a1a1a 100%)' : '#1a1a1a', border: currentMobileIndex === 0 ? '1px solid gold' : currentMobileIndex === 1 ? '1px solid silver' : currentMobileIndex === 2 ? '1px solid #cd7f32' : '1px solid #333' }}>
                <button 
                  onClick={() => setSelectedProfile(students[currentMobileIndex])}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', zIndex: 5 }}
                >
                  See Profile
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
                    border: `3px solid ${currentMobileIndex === 0 ? 'gold' : currentMobileIndex === 1 ? 'silver' : currentMobileIndex === 2 ? '#cd7f32' : '#555'}`,
                    boxShadow: `0 0 15px ${currentMobileIndex === 0 ? 'rgba(255,215,0,0.4)' : currentMobileIndex === 1 ? 'rgba(192,192,192,0.4)' : currentMobileIndex === 2 ? 'rgba(205,127,50,0.4)' : 'rgba(0,0,0,0)'}`
                  }}>
                    <img 
                      src={students[currentMobileIndex]?.profilePhotoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (students[currentMobileIndex]?.name || 'default')} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: currentMobileIndex === 0 ? 'gold' : currentMobileIndex === 1 ? 'silver' : currentMobileIndex === 2 ? '#cd7f32' : 'white', marginBottom: '1rem' }}>
                  #{currentMobileIndex + 1}
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{students[currentMobileIndex]?.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{students[currentMobileIndex]?.branch?.name}</p>
                <div style={{ background: '#222', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  {students[currentMobileIndex]?.currentBelt}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  {(() => {
                    const student = students[currentMobileIndex];
                    if (!student) return null;
                    const approvedAch = student?.achievements?.filter((a: any) => a.status === 'Approved' || (!a.status && a.status !== 'Pending')) || [];
                    
                    let filtered = approvedAch;
                    if (filter === 'Classroom') {
                      filtered = approvedAch.filter((a: any) => a.level === 'Classroom' || a.level === 'Class' || a.level === 'District');
                    } else if (filter === 'State') {
                      filtered = approvedAch.filter((a: any) => a.level === 'State');
                    } else if (filter === 'National') {
                      filtered = approvedAch.filter((a: any) => a.level === 'National');
                    } else if (filter === 'Competition') {
                      filtered = approvedAch.filter((a: any) => a.event?.name?.toLowerCase().includes('comp'));
                    } else if (filter === 'Belt Exam') {
                      filtered = approvedAch.filter((a: any) => a.event?.name?.toLowerCase().includes('belt'));
                    }

                    const gold = filtered.filter((a: any) => a.medal === 'Gold').length;
                    const silver = filtered.filter((a: any) => a.medal === 'Silver').length;
                    const bronze = filtered.filter((a: any) => a.medal === 'Bronze').length;
                    
                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}>🥇</span>
                          <span style={{ fontWeight: 'bold' }}>{gold}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}>🥈</span>
                          <span style={{ fontWeight: 'bold' }}>{silver}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}>🥉</span>
                          <span style={{ fontWeight: 'bold' }}>{bronze}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div style={{ background: 'rgba(255, 51, 51, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{filter} Points</div>
                  <div style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: 'bold' }}>{students[currentMobileIndex]?.currentFilterPoints}</div>
                </div>
              </div>

              <button 
                onClick={() => setCurrentMobileIndex(prev => prev === students.length - 1 ? 0 : prev + 1)}
                style={{ position: 'absolute', right: -15, zIndex: 10, background: '#333', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
              >
                &#8250;
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Student {currentMobileIndex + 1} of {students.length}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <button 
                className="btn btn-outline view-rules-btn" 
                onClick={() => setShowRules(true)}
                style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', padding: '0.4rem 1rem', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', borderRadius: '4px' }}
              >
                View Point Rules
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No students found.
        </div>
      )}

      {showRules && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '85%', padding: '1.5rem', position: 'relative' }}>
            <button 
              onClick={() => setShowRules(false)}
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h2 className="text-secondary" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Point Rules</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Base points awarded per medal:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', color: 'gold' }}><strong>Rank 1 (Gold):</strong> 3 Points</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', color: 'silver' }}><strong>Rank 2 (Silver):</strong> 2 Points</li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', color: '#cd7f32' }}><strong>Rank 3 (Bronze):</strong> 1 Point</li>
            </ul>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              * Note: Points may vary for different belt exams and events.
            </p>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '2rem', position: 'relative', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setSelectedProfile(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.8rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem auto', border: '3px solid var(--primary)' }}>
              <img 
                src={selectedProfile.profilePhotoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (selectedProfile.name || 'default')} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>{selectedProfile.name}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{selectedProfile.branch?.name}</p>
            
            <div style={{ display: 'inline-block', background: '#333', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              {selectedProfile.currentBelt}
            </div>

            {selectedProfile.instagramLink && (
              <div style={{ marginBottom: '1.5rem' }}>
                <a 
                  href={selectedProfile.instagramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', width: '45px', height: '45px', borderRadius: '50%', color: 'white', textDecoration: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
                  title="View Instagram Profile"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            )}

            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', textAlign: 'left' }}>Achievements</h3>
            
            {selectedProfile.achievements?.filter((a: any) => a.status === 'Approved').length > 0 ? (
              <div style={{ textAlign: 'left' }}>
                {selectedProfile.achievements.filter((a: any) => a.status === 'Approved').map((ach: any) => (
                  <div key={ach.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: '#1a1a1a', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #333' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{ach.event?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ach.level}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                        {ach.medal === 'Gold' ? '🥇' : ach.medal === 'Silver' ? '🥈' : ach.medal === 'Bronze' ? '🥉' : '🏅'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>+{ach.pointsEarned} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No achievements yet.</p>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 768px) {
          .hide-scrollbar {
            justify-content: flex-start !important;
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}} />
    </div>
  );
}
