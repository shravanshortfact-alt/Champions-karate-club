export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { getSiteSettings } from '@/lib/settings';
import MapSection from '@/components/MapSection';
import { Medal, Flame, ShieldCheck } from 'lucide-react';
import RegistrationLink from '@/components/RegistrationLink';

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(rgba(10,10,10,0.85), rgba(10,10,10,0.92)), url("https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80") center/cover'
      }}>
        <div className="container" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', lineHeight: 1.15 }}>
            UNLEASH YOUR INNER CHAMPION
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.2rem)', margin: '0 auto 2rem', color: '#e4e4e7' }}>
            Join the most elite karate club. Train your mind, body, and spirit with world-class instructors.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register/admission" className="btn btn-primary hero-btn" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}>
              JOIN NOW
            </a>
            <a href="/student" className="btn btn-outline hero-btn" style={{ borderColor: 'var(--primary)', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '0.8rem 1.8rem', fontSize: '1rem' }}>
              STUDENT PORTAL
            </a>
          </div>
        </div>
      </section>

      {/* Quick Registration Links */}
      <section className="container" style={{ padding: '3rem 1rem 2rem', textAlign: 'center' }}>
        <h2 className="text-primary section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>Register Online</h2>
        <div className="register-grid">
          {(settings.registrationLinks && settings.registrationLinks.length > 0 ? settings.registrationLinks : [
            { title: "Admission", description: "Join the academy", link: "/register/admission" },
            { title: "Belt Exam", description: "Register for grading", link: "/register/belt-exam" },
            { title: "Competition", description: "Enter upcoming events", link: "/register/competition" },
            { title: "Seminar", description: "Special training camps", link: "/register/seminar" },
            { title: "Fee Payment", description: "Pay your monthly fees", link: "/pay-fee" }
          ]).map((linkItem: any, i: number) => {
            let isLocked = false;
            if (linkItem.link.includes('competition') && (settings.formLocks?.competition === true || String(settings.formLocks?.competition) === 'true')) isLocked = true;
            if (linkItem.link.includes('seminar') && (settings.formLocks?.seminar === true || String(settings.formLocks?.seminar) === 'true')) isLocked = true;
            if (linkItem.link.includes('belt-exam') && (settings.formLocks?.beltExam === true || String(settings.formLocks?.beltExam) === 'true')) isLocked = true;

            return (
              <RegistrationLink key={i} linkItem={linkItem} isLocked={isLocked} />
            );
          })}
        </div>
      </section>

      {/* Main Master / Founder Section */}
      <section className="container" style={{ padding: '2.5rem 1rem 3.5rem' }}>
        <h2 className="text-center text-primary section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>Meet Our Master</h2>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {(() => {
            const mainMaster = (settings.instructors && settings.instructors.length > 0 && settings.instructors[0]?.name)
              ? settings.instructors[0]
              : { name: "Sensei Kenjiro", rank: "Founder & Chief Instructor - 8th Dan Black Belt", photoUrl: "/instructor.png" };

            return (
              <div className="single-master-card" style={{ 
                width: '100%', 
                maxWidth: '420px', 
                margin: '0 auto', 
                background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                border: '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                textAlign: 'center'
              }}>
                <div style={{ position: 'relative', width: '100%', height: '380px', background: '#000' }}>
                  <Image 
                    src={mainMaster.photoUrl || "/instructor.png"} 
                    alt={mainMaster.name || "Main Master"} 
                    fill 
                    style={{ objectFit: 'cover', objectPosition: 'top center' }} 
                  />
                </div>
                <div style={{ padding: '1.5rem 1rem' }}>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)', margin: '0 0 0.4rem 0', fontWeight: 800 }}>
                    {mainMaster.name}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                    {mainMaster.rank}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Training Programs Section */}
      <section style={{ background: 'var(--bg-card)', padding: '3.5rem 1rem', overflow: 'hidden' }}>
        <div className="container">
          <h2 className="text-center text-primary section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>Our Training Programs</h2>
          <div className="programs-grid">
            {[
              { title: "Kata (Form)", desc: "Master detailed choreography of martial movements.", icon: <Flame className="text-primary" size={32} /> },
              { title: "Kumite (Sparring)", desc: "Controlled, tactical combat training for real scenario application.", icon: <ShieldCheck className="text-secondary" size={32} /> },
              { title: "Self Defense", desc: "Practical techniques designed for real-world personal protection.", icon: <Medal className="text-primary" size={32} /> }
            ].map((program, i) => (
              <div key={i} className="card program-card" style={{ textAlign: 'center', padding: '1.5rem 1rem', borderRadius: '12px' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{program.icon}</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{program.title}</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Gallery Section ("See Us in Action") */}
      <section className="container" style={{ padding: '3.5rem 1rem' }}>
        <h2 className="text-center text-primary section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>See Us in Action</h2>
        <div className="videos-grid">
          {((settings.videos && settings.videos.filter((v: any) => v && v.url && v.url.trim() !== '').length > 0)
            ? settings.videos.filter((v: any) => v && v.url && v.url.trim() !== '')
            : []
          ).map((video: any, i: number) => {
            let url = (video.url || '').trim();

            // Prefix relative API URLs with Worker domain so it streams directly from Cloudflare D1
            if (url.startsWith('/')) {
              url = `https://karate-club.shravanshortfact.workers.dev${url}`;
            }

            // 1. YouTube (Watch, Shorts, Mobile links)
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              let embedUrl = url;
              try {
                if (url.includes('youtube.com/shorts/')) {
                  const id = url.split('shorts/')[1]?.split('?')[0];
                  embedUrl = `https://www.youtube.com/embed/${id}`;
                } else if (url.includes('watch?v=')) {
                  const id = url.split('watch?v=')[1]?.split('&')[0];
                  embedUrl = `https://www.youtube.com/embed/${id}`;
                } else if (url.includes('youtu.be/')) {
                  const id = url.split('youtu.be/')[1]?.split('?')[0];
                  embedUrl = `https://www.youtube.com/embed/${id}`;
                }
              } catch (e) {
                embedUrl = url;
              }
              return (
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <h3 className="video-title" style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>{video.title || `Video #${i + 1}`}</h3>
                  <iframe
                    src={embedUrl}
                    title={video.title || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '320px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                  />
                </div>
              );
            }

            // 2. Instagram (Reels & Posts)
            if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
              let embedUrl = url.split('?')[0];
              if (!embedUrl.endsWith('/')) embedUrl += '/';
              embedUrl += 'embed';
              return (
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <h3 className="video-title" style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>{video.title || `Video #${i + 1}`}</h3>
                  <iframe
                    src={embedUrl}
                    title={video.title || 'Instagram Video'}
                    allowFullScreen
                    style={{ width: '100%', height: '380px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                  />
                </div>
              );
            }

            // 3. Google Drive
            if (url.includes('drive.google.com')) {
              let embedUrl = url.replace('/view', '/preview');
              return (
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <h3 className="video-title" style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>{video.title || `Video #${i + 1}`}</h3>
                  <iframe
                    src={embedUrl}
                    title={video.title || 'Drive Video'}
                    allow="autoplay"
                    allowFullScreen
                    style={{ width: '100%', height: '320px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                  />
                </div>
              );
            }

            // 4. Direct MP4 / WebM / Base64 / DB Media Stream
            return (
              <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <h3 className="video-title" style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>{video.title || `Video #${i + 1}`}</h3>
                <video 
                  src={url} 
                  controls 
                  playsInline
                  preload="metadata"
                  className="video-player"
                  style={{ width: '100%', maxHeight: '380px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container" style={{ padding: '2rem 1rem 3.5rem', textAlign: 'center' }}>
        <h2 className="text-primary section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>Our Stats</h2>
        <div className="stats-grid">
          {[
            { num: "50+", label: "National Medals" },
            { num: "12", label: "International Champions" },
            { num: "500+", label: "Active Students" }
          ].map((stat, i) => (
            <div key={i} className="card stat-card" style={{ padding: '1.5rem 0.5rem', borderRadius: '12px' }}>
              <div className="stat-number" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', color: 'var(--secondary)', fontWeight: 800 }}>{stat.num}</div>
              <div className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="container" style={{ padding: '2rem 1rem 5rem' }}>
        <MapSection />
      </section>
    </div>
  );
}
