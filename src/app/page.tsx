import Image from 'next/image';
import { promises as fs } from 'fs';
import path from 'path';
import MapSection from '@/components/MapSection';
import { Medal, Flame, ShieldCheck, Lock } from 'lucide-react';

async function getSiteSettings() {
  const dbPath = path.join(process.cwd(), 'data', 'settings.json');
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return defaults if file doesn't exist yet
    return {
      logoUrl: '',
      instructor: {
        name: 'Sensei Kenjiro',
        rank: '8th Dan Black Belt',
        experience: 'With over 30 years of martial arts experience, Sensei Kenjiro has trained national champions and international medalists.',
        photoUrl: '/instructor.png'
      },
      achievements: [
        '5x National Champion',
        'Gold Medalist - Asian Karate Championships',
        'Certified World Karate Federation Coach'
      ]
    };
  }
}

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
            if (linkItem.link.includes('competition') && settings.formLocks?.competition) isLocked = true;
            if (linkItem.link.includes('seminar') && settings.formLocks?.seminar) isLocked = true;
            if (linkItem.link.includes('belt-exam') && settings.formLocks?.beltExam) isLocked = true;

            const LinkWrapper = isLocked ? 'div' : 'a';
            return (
              <LinkWrapper 
                key={i} 
                {...(!isLocked ? { href: linkItem.link } : {})}
                className="card"
                style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3>{linkItem.title}</h3>
                  {isLocked && <Lock size={20} color="var(--danger-color, red)" />}
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                  {isLocked ? "Currently Locked" : linkItem.description}
                </p>
              </LinkWrapper>
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
          {(settings.videos || []).map((video: any, i: number) => (
            <div key={i} className="video-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 className="video-title">{video.title}</h3>
              <video 
                src={video.url || undefined} 
                controls 
                className="video-player"
              />
            </div>
          ))}
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
