'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/auth/hooks';
import { signOut } from '@/lib/auth/actions';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';
import { ProfileSheet } from '@/components/profile/profile-sheet';
import { ROLE_COLORS, ROLE_DISPLAY } from '@/lib/constants/role-display';
import type { Role } from '@/lib/constants/roles';

export function UserMenu() {
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  if (!profile) return null;

  // Get user initials for avatar fallback
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Role badge color
  const roleColor = ROLE_COLORS[profile.role as Role] || ROLE_COLORS.general_user;

  // Format role display name
  const roleDisplay = ROLE_DISPLAY[profile.role as Role] || profile.role;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User info button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name and role */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {profile.full_name}
          </p>
          <p className={`text-xs px-1.5 py-0.5 rounded ${roleColor} inline-block mt-0.5`}>
            {roleDisplay}
          </p>
        </div>

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu - positioned upward */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <button
            data-profile-trigger
            onClick={() => {
              setIsOpen(false);
              setProfileOpen(true);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Profile
          </button>
          {hasPermission(profile.role, PERMISSIONS.ADMIN_PANEL) && (
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Settings
            </Link>
          )}
          <hr className="border-gray-200" />
          <button
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Profile Sheet */}
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
