"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  GraduationCap,
  CreditCard,
  Link as LinkIcon,
  Users,
  Award,
  Trophy,
  Calendar,
  BarChart3,
  Bell,
  MessageCircle,
  MapPin,
  UserCog,
  Archive,
  Settings
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Admissions', href: '/admin/admissions', icon: GraduationCap },
  { name: 'Fee Payments', href: '/admin/fees', icon: CreditCard },
  { name: 'Registration Links', href: '/admin/registration-links', icon: LinkIcon },
  { name: 'Active Students', href: '/admin/students', icon: Users },
  { name: 'Belt Exams', href: '/admin/exams', icon: Award },
  { name: 'Competitions', href: '/admin/competitions', icon: Trophy },
  { name: 'Seminars', href: '/admin/seminars', icon: Calendar },
  { name: 'Rankings', href: '/admin/rankings', icon: BarChart3 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'WhatsApp Msgs', href: '/admin/messages', icon: MessageCircle },
  { name: 'Map & Branches', href: '/admin/map-branches', icon: MapPin },
  { name: 'Manage Teachers & UPI', href: '/admin/teachers', icon: UserCog },
  { name: 'Archives', href: '/admin/archives', icon: Archive },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: '260px',
        background: '#09090b',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Title */}
      <div style={{ padding: '0.25rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <h2
          style={{
            margin: 0,
            color: '#ef4444',
            fontWeight: 800,
            fontSize: '1.55rem',
            letterSpacing: '-0.5px',
            textTransform: 'capitalize'
          }}
        >
          Admin Panel
        </h2>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' 
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.65rem 0.95rem',
                borderRadius: '9px',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: isActive ? 600 : 500,
                color: '#ffffff',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.45) 0%, rgba(24, 24, 27, 0.9) 100%)' 
                  : '#141416',
                border: isActive 
                  ? '1px solid rgba(239, 68, 68, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderLeft: isActive 
                  ? '4px solid #ef4444' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isActive 
                  ? '0 4px 15px rgba(239, 68, 68, 0.25)' 
                  : 'none',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#141416';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              <Icon
                size={19}
                style={{
                  color: '#ef4444',
                  flexShrink: 0
                }}
              />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
