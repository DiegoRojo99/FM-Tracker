'use client'

import { useAuth } from '../components/AuthProvider';
import ProfileHeader from './ProfileHeader';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-darker)] to-[var(--color-dark)] p-6">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader />
      </div>
    </div>
  );
}
