import { useAuth } from '@/app/components/AuthProvider';
import Image from 'next/image';

export default function ProfileHeader() {
  const { user } = useAuth();
  if (!user) return null;

  // Fallbacks for missing info
  const displayName = user.displayName || user.email || 'Unknown User';
  const email = user.email || 'No email';
  const photoURL = user.photoURL || '/default-avatar.png';
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-[var(--color-darker)] rounded-xl shadow-lg">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--color-primary)] bg-gray-700">
        <Image
          src={photoURL}
          alt="User avatar"
          fill
          style={{ objectFit: 'cover' }}
          sizes="96px"
        />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-white">{displayName}</h2>
        <p className="text-gray-400 text-sm">{email}</p>
      </div>
    </div>
  );
}