import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>Admin Panel</h3>
        <ul className="admin-nav">
          <li><a href="/admin">Dashboard</a></li>
          <li><a href="/admin/registration-links">Registration Links</a></li>
          <li><a href="/admin/settings">Site Settings</a></li>
          <li><a href="/admin/admissions">Admissions</a></li>
          <li><a href="/admin/students">Active Students</a></li>
          <li><a href="/admin/fees">Fee Payments</a></li>
          <li><a href="/admin/exams">Belt Exams</a></li>
          <li><a href="/admin/competitions">Competitions</a></li>
          <li><a href="/admin/seminars">Seminars</a></li>
          <li><a href="/admin/archives">Archives</a></li>
          <li><a href="/admin/rankings">Rankings</a></li>
          <li><a href="/admin/notifications">🔔 Notifications</a></li>
          <li><a href="/admin/messages">WhatsApp Msgs</a></li>
          <li><a href="/admin/map-branches">📍 Map & Branches</a></li>
        </ul>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
