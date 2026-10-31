"use client";

import React, { useState, useRef, useEffect } from 'react';

export interface BeltOption {
  id: string;
  name: string;
  emoji: string;
  colorCss: string;
  borderColor: string;
  isDual?: boolean;
}

export const KARATE_BELTS: BeltOption[] = [
  { id: 'White Belt', name: 'White Belt', emoji: '⚪', colorCss: '#ffffff', borderColor: '#cbd5e1' },
  { id: 'Yellow Belt', name: 'Yellow Belt', emoji: '🟡', colorCss: '#facc15', borderColor: '#ca8a04' },
  { id: 'Orange Belt', name: 'Orange Belt', emoji: '🟠', colorCss: '#f97316', borderColor: '#ea580c' },
  { id: 'Green Belt', name: 'Green Belt', emoji: '🟢', colorCss: '#22c55e', borderColor: '#16a34a' },
  { id: 'Blue Belt', name: 'Blue Belt', emoji: '🔵', colorCss: '#3b82f6', borderColor: '#2563eb' },
  { id: 'Purple Belt', name: 'Purple Belt', emoji: '🟣', colorCss: '#a855f7', borderColor: '#9333ea' },
  { id: 'Red Belt', name: 'Red Belt', emoji: '🔴', colorCss: '#ef4444', borderColor: '#dc2626' },
  { id: 'Brown Belt', name: 'Brown Belt', emoji: '🟤', colorCss: '#78350f', borderColor: '#451a03' },
  { 
    id: 'Black-Brown Belt', 
    name: 'Black-Brown Belt', 
    emoji: '🟤⚫', 
    colorCss: 'linear-gradient(90deg, #78350f 50%, #000000 50%)', 
    borderColor: '#a16207', 
    isDual: true 
  },
  { id: 'Black Belt', name: 'Black Belt', emoji: '⚫', colorCss: '#09090b', borderColor: '#eab308' },
];

export const BELT_NAMES = KARATE_BELTS.map(b => b.name);

interface BeltSelectorProps {
  value: string;
  onChange: (belt: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export default function BeltSelector({
  value,
  onChange,
  required = false,
  label,
  placeholder = "-- Choose Current Belt --"
}: BeltSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBelt = KARATE_BELTS.find(
    b => b.name.toLowerCase() === (value || '').toLowerCase() || b.id.toLowerCase() === (value || '').toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (beltName: string) => {
    onChange(beltName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* Hidden input for HTML form validation */}
      <input
        type="text"
        value={value || ''}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          width: 0,
          bottom: 0
        }}
      />

      {/* Custom Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.85rem 1rem',
          background: '#111827',
          border: isOpen ? '1px solid #ef4444' : '1px solid #374151',
          borderRadius: '8px',
          color: selectedBelt ? '#ffffff' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '1rem',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          {selectedBelt ? (
            <>
              {/* Belt Color Box */}
              <span
                style={{
                  display: 'inline-block',
                  width: '28px',
                  height: '16px',
                  borderRadius: '3px',
                  background: selectedBelt.colorCss,
                  border: `1px solid ${selectedBelt.borderColor}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  flexShrink: 0
                }}
              />
              <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{selectedBelt.name}</span>
            </>
          ) : (
            <span style={{ color: '#6b7280' }}>{placeholder}</span>
          )}
        </div>

        {/* Chevron Icon */}
        <svg
          style={{
            width: '18px',
            height: '18px',
            color: '#9ca3af',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '0.5rem'
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '0.4rem',
            backdropFilter: 'blur(12px)'
          }}
        >
          {KARATE_BELTS.map((belt) => {
            const isSelected = selectedBelt?.id === belt.id;

            return (
              <div
                key={belt.id}
                onClick={() => handleSelect(belt.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                  marginBottom: '2px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Stylized Belt Box */}
                  <div
                    style={{
                      width: '32px',
                      height: '18px',
                      borderRadius: '4px',
                      background: belt.colorCss,
                      border: `1.5px solid ${belt.borderColor}`,
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    {/* Small inner stitch line to look like an authentic karate belt */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: belt.name === 'White Belt' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                        transform: 'translateY(-50%)'
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#ffffff' : '#e2e8f0'
                    }}
                  >
                    {belt.name}
                  </span>
                </div>

                {isSelected && (
                  <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1rem' }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
