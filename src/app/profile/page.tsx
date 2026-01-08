'use client'

import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/db/firebase';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-darker)] to-[var(--color-dark)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--color-dark)] rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">
              Welcome, {user.displayName || user.email}
            </h1>
            <button
              onClick={() => handleLogout()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
          {/* UserStatsOverview will be rendered here in the future */}
        </div>
      </div>
    </div>
  );
}
