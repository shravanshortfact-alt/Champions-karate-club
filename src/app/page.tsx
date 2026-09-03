export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { getSiteSettings } from '@/lib/settings';
import MapSection from '@/components/MapSection';
import { Medal, Flame, ShieldCheck, Lock } from 'lucide-react';
import RegistrationLink from '@/components/RegistrationLink';


export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(rgba(10,10,10,0.8), rgba(10,10,10,0.9)), url("https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80") center/cover'
      }}>
        <div className="container">
          <h1 className="hero-title">
            UNLEASH YOUR INNER CHAMPION
          </h1>
          <p className="hero-subtitle">
            Join the most elite karate club. Train your mind, body, and spirit with world-class instructors.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/register/admission" className="btn btn-primary hero-btn">
              JOIN NOW
            </a>
            <a href="/student" className="btn btn-outline hero-btn" style={{ borderColor: 'var(--primary)', color: 'white', background: 'rgba(0,0,0,0.5)' }}>
              STUDENT PORTAL
            </a>
          </div>
        </div>
      </section>

      {/* Quick Registration Links */}
      <section className="container" style={{ padding: '4rem 2rem 2rem', textAlign: 'center' }}>
        <h2 className="text-primary section-title">Register Online</h2>
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

      {/* Instructor Section */}
      <section className="container" style={{ padding: '2rem 2rem 4rem' }}>
        <h2 className="text-center text-primary section-title">Meet Our Masters</h2>
        <div className="grid masters-grid">
          {(settings.instructors || []).sort((a: any, b: any) => (b.medals || 0) - (a.medals || 0)).map((instructor: any, i: number) => (
            <div key={i} className="instructor-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
              <div className="instructor-img" style={{ position: 'relative' }}>
                <Image src={instructor.photoUrl || "/instructor.png"} alt={instructor.name} fill style={{ objectFit: 'cover', objectPosition: 'top center' }} />
              </div>
              <div className="instructor-info">
                <h3 className="instructor-name">{instructor.name}</h3>
                <h4 className="instructor-rank">{instructor.rank}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Training Programs Section */}
      <section style={{ background: '#09090b', padding: '6rem 0', overflow: 'hidden', position: 'relative' }}>
        <div className="container">
          <h2 className="text-center text-primary section-title" style={{ marginBottom: '3rem' }}>Our Training Programs</h2>
          
          {/* Desktop & Mobile Programs Container */}
          <div className="programs-wrapper">
            <div className="programs-grid">
              {(settings.programs && settings.programs.length > 0 ? settings.programs : [
                { title: "Beginner Karate", icon: Medal },
                { title: "Advanced Kata & Kumite", icon: Flame },
                { title: "Self-Defense & Fitness", icon: ShieldCheck }
              ]).map((prog: any, i: number) => {
                const IconComp = prog.icon;
                return (
                  <div key={i} className="program-card text-center">
                    <div className="program-icon-badge">
                      {typeof prog.icon === 'string' ? prog.icon : <IconComp size={30} color="#ef4444" />}
                    </div>
                    <h3 className="program-card-title">{prog.title}</h3>
                  </div>
                );
              })}

              {/* Duplicates for Infinite Smooth Marquee on Mobile */}
              {(settings.programs && settings.programs.length > 0 ? settings.programs : [
                { title: "Beginner Karate", icon: Medal },
                { title: "Advanced Kata & Kumite", icon: Flame },
                { title: "Self-Defense & Fitness", icon: ShieldCheck }
              ]).map((prog: any, i: number) => {
                const IconComp = prog.icon;
                return (
                  <div key={`dup-${i}`} className="program-card text-center duplicate-for-marquee">
                    <div className="program-icon-badge">
                      {typeof prog.icon === 'string' ? prog.icon : <IconComp size={30} color="#ef4444" />}
                    </div>
                    <h3 className="program-card-title">{prog.title}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="container" style={{ padding: '6rem 2rem' }}>
        <h2 className="text-center text-primary section-title">See Us in Action</h2>
        <div className="videos-grid">
          {(settings.videos || []).filter((v: any) => v && v.url && v.url.trim() !== '').map((video: any, i: number) => {
            const url = video.url.trim();

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
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 className="video-title">{video.title || `Video #${i + 1}`}</h3>
                  <iframe
                    src={embedUrl}
                    title={video.title || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '380px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
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
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 className="video-title">{video.title || `Video #${i + 1}`}</h3>
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
                <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 className="video-title">{video.title || `Video #${i + 1}`}</h3>
                  <iframe
                    src={embedUrl}
                    title={video.title || 'Drive Video'}
                    allow="autoplay"
                    allowFullScreen
                    style={{ width: '100%', height: '380px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                  />
                </div>
              );
            }

            // 4. Direct MP4 / WebM / Base64 Video File
            return (
              <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 className="video-title">{video.title || `Video #${i + 1}`}</h3>
                <video 
                  src={url} 
                  controls 
                  playsInline
                  preload="metadata"
                  className="video-player"
                  style={{ width: '100%', height: '380px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#000' }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements Section */}
      <section style={{ background: 'var(--bg-card)', padding: '6rem 2rem', overflow: 'hidden' }}>
        <div className="container">
          <h2 className="text-center text-primary section-title">Our Stats</h2>
          <div className="stats-grid text-center">
            <div className="card">
              <h3 className="stat-number text-secondary">50+</h3>
              <p className="stat-text">National Medals</p>
            </div>
            <div className="card">
              <h3 className="stat-number text-secondary">12</h3>
              <p className="stat-text">International Champions</p>
            </div>
            <div className="card">
              <h3 className="stat-number text-secondary">500+</h3>
              <p className="stat-text">Active Students</p>
            </div>
            <div className="card duplicate-for-marquee">
              <h3 className="stat-number text-secondary">50+</h3>
              <p className="stat-text">National Medals</p>
            </div>
            <div className="card duplicate-for-marquee">
              <h3 className="stat-number text-secondary">12</h3>
              <p className="stat-text">International Champions</p>
            </div>
            <div className="card duplicate-for-marquee">
              <h3 className="stat-number text-secondary">500+</h3>
              <p className="stat-text">Active Students</p>
            </div>
          </div>
        </div>
      </section>

      <MapSection />
    </div>
  );
}
