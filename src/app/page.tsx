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
      <section style={{ background: 'var(--bg-card)', padding: '6rem 2rem', overflow: 'hidden' }}>
        <div className="container">
          <h2 className="text-center text-primary section-title">Our Training Programs</h2>
          <div className="programs-grid" style={{ gap: '2rem' }}>
            {(settings.programs && settings.programs.length > 0 ? settings.programs : [
              { title: "Beginner Karate", icon: Medal },
              { title: "Advanced Kata & Kumite", icon: Flame },
              { title: "Self-Defense & Fitness", icon: ShieldCheck }
            ]).map((prog: any, i: number) => {
              const IconComp = prog.icon;
              return (
                <div key={i} className="card program-card text-center">
                  <div className="premium-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
                    {typeof prog.icon === 'string' ? prog.icon : <IconComp size={56} />}
                  </div>
                  <h3 className="text-secondary" style={{ fontSize: '1.2rem', margin: 0 }}>{prog.title}</h3>
                </div>
              );
            })}
            {/* Duplicates for Marquee Animation on Mobile */}
            {(settings.programs && settings.programs.length > 0 ? settings.programs : [
              { title: "Beginner Karate", icon: Medal },
              { title: "Advanced Kata & Kumite", icon: Flame },
              { title: "Self-Defense & Fitness", icon: ShieldCheck }
            ]).map((prog: any, i: number) => {
              const IconComp = prog.icon;
              return (
                <div key={`dup-${i}`} className="card program-card duplicate-for-marquee text-center">
                  <div className="premium-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
                    {typeof prog.icon === 'string' ? prog.icon : <IconComp size={56} />}
                  </div>
                  <h3 className="text-secondary" style={{ fontSize: '1.2rem', margin: 0 }}>{prog.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="container" style={{ padding: '6rem 2rem' }}>
        <h2 className="text-center text-primary section-title">See Us in Action</h2>
        <div className="videos-grid">
          {(settings.videos || []).map((video: any, i: number) => {
            const isYouTube = video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'));
            let embedUrl = video.url;
            if (isYouTube) {
              if (video.url.includes('shorts/')) {
                embedUrl = video.url.replace('shorts/', 'embed/');
              } else if (video.url.includes('watch?v=')) {
                embedUrl = video.url.replace('watch?v=', 'embed/');
              } else if (video.url.includes('youtu.be/')) {
                embedUrl = video.url.replace('youtu.be/', 'www.youtube.com/embed/');
              }
            }
            return (
              <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 className="video-title">{video.title}</h3>
                {isYouTube ? (
                  <iframe
                    src={embedUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '350px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <video 
                    src={video.url || undefined} 
                    controls 
                    className="video-player"
                  />
                )}
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
