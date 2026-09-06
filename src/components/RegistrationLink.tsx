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
      className={`reg-link-card ${isHovered && !isLocked ? 'hovered' : ''} ${isLocked ? 'locked' : ''}`}
    >
      {/* Lock Indicator Tag */}
      {isLocked && (
        <div className="reg-link-lock-tag">
          <Lock size={10} color="#ef4444" />
          <span>LOCKED</span>
        </div>
      )}

      {/* Red Circular Icon Badge */}
      <div className="reg-link-icon-badge">
        <IconComp size={24} color="#ef4444" />
      </div>

      {/* Title */}
      <h3 className="reg-link-title">
        {linkItem.title}
      </h3>

      {/* Description */}
      <p className="reg-link-desc">
        {isLocked ? "Currently Locked" : linkItem.description}
      </p>
    </div>
  );
}
