"use client";

import { UserPlus, Award, Trophy, GraduationCap, CreditCard, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function getLinkIcon(title: string, link: string) {
  const t = (title || '').toLowerCase();
  const l = (link || '').toLowerCase();
  if (t.includes('admission') || l.includes('admission')) return UserPlus;
  if (t.includes('belt') || l.includes('belt')) return Award;
  if (t.includes('competition') || l.includes('competition')) return Trophy;
  if (t.includes('seminar') || l.includes('seminar')) return GraduationCap;
  if (t.includes('fee') || l.includes('fee')) return CreditCard;
  return UserPlus;
}

export default function RegistrationLink({ linkItem, isLocked }: { linkItem: any, isLocked: boolean }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("This registration form is currently locked by admin.");
    } else {
      router.push(linkItem.link);
    }
  };

  const IconComp = getLinkIcon(linkItem.title, linkItem.link);

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered && !isLocked ? '#161619' : '#0d0d0f',
        border: isHovered && !isLocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '2.2rem 1.2rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered && !isLocked ? 'translateY(-6px)' : 'none',
        boxShadow: isHovered && !isLocked 
          ? '0 12px 30px -8px rgba(239, 68, 68, 0.25), 0 0 15px rgba(239, 68, 68, 0.12)' 
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Red Circular Icon Badge */}
      <div 
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: isHovered && !isLocked ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.2rem',
          color: '#ef4444',
          transition: 'all 0.3s ease',
          boxShadow: isHovered && !isLocked ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
        }}
      >
        <IconComp size={24} color="#ef4444" />
      </div>

      {/* Title */}
      <h3 style={{ 
        fontSize: '1.15rem', 
        fontWeight: '700', 
        color: '#ffffff', 
        margin: '0 0 0.4rem 0',
        letterSpacing: '0.01em',
        fontFamily: "'Outfit', sans-serif"
      }}>
        {linkItem.title}
      </h3>

      {/* Description */}
      <p style={{ 
        fontSize: '0.88rem', 
        color: '#9ca3af', 
        margin: 0,
        lineHeight: '1.4'
      }}>
        {isLocked ? "Currently Locked" : linkItem.description}
      </p>

      {/* Lock Indicator */}
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '20px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Lock size={12} color="#ef4444" />
          <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 'bold' }}>LOCKED</span>
        </div>
      )}
    </div>
  );
}
