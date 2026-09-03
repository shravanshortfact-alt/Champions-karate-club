"use client";

import { Lock, ChevronRight, UserPlus, Award, Trophy, GraduationCap, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegistrationLink({ linkItem, isLocked }: { linkItem: any, isLocked: boolean }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Form is currently locked by Admin.");
    } else {
      router.push(linkItem.link);
    }
  };

  const getIcon = () => {
    const title = linkItem.title?.toLowerCase() || '';
    if (title.includes('admission')) return <UserPlus size={22} />;
    if (title.includes('belt')) return <Award size={22} />;
    if (title.includes('competition')) return <Trophy size={22} />;
    if (title.includes('seminar')) return <GraduationCap size={22} />;
    if (title.includes('fee') || title.includes('pay')) return <CreditCard size={22} />;
    return <ChevronRight size={22} />;
  };

  return (
    <div 
      onClick={handleClick}
      className={`card register-link-card ${isLocked ? 'is-locked' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '1.25rem 1rem',
        borderRadius: '12px',
        background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
        border: isLocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer'
      }}
    >
      {isLocked && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444' }}>
          <Lock size={16} />
        </div>
      )}

      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 46, 46, 0.15)',
        color: isLocked ? '#ef4444' : 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.75rem',
        border: isLocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 46, 46, 0.3)'
      }}>
        {getIcon()}
      </div>

      <h3 style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        margin: '0 0 0.3rem 0',
        lineHeight: 1.25
      }}>
        {linkItem.title}
      </h3>

      <p className="text-muted" style={{
        fontSize: '0.85rem',
        color: '#a1a1aa',
        margin: 0,
        lineHeight: 1.3
      }}>
        {isLocked ? "Currently Locked" : linkItem.description}
      </p>
    </div>
  );
}
