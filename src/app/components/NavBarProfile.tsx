import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function NavBarProfile() {
  const { user } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-4">
      {user ? (
        <Link href="/profile" className="hover:text-[var(--color-highlight)]">
          <Image
            src={user.photoURL || "/default-avatar.png"}
            alt={user.displayName || user.email || "User Avatar"}
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
      ) : (
        <Link href="/login" className="hover:text-[var(--color-highlight)]">
          Login
        </Link>
      )}
    </div>
  );
}