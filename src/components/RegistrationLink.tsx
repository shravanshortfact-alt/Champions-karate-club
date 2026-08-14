"use client";

import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegistrationLink({ linkItem, isLocked }: { linkItem: any, isLocked: boolean }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Form is locked");
    } else {
      router.push(linkItem.link);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="card"
      style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3>{linkItem.title}</h3>
        {isLocked && <Lock size={20} color="var(--danger-color, red)" />}
      </div>
      <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
        {isLocked ? "Currently Locked" : linkItem.description}
      </p>
    </div>
  );
}
